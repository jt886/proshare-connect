"use server";

// --- Heavy Polyfills for Vercel Environment ---
if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
        constructor() { }
        static fromFloat32Array() { return new DOMMatrix(); }
        static fromFloat64Array() { return new DOMMatrix(); }
    };
}
if (typeof (globalThis as any).Path2D === "undefined") {
    (globalThis as any).Path2D = class Path2D { };
}
if (typeof (globalThis as any).ImageData === "undefined") {
    (globalThis as any).ImageData = class ImageData {
        constructor() { }
    };
}
if (typeof (globalThis as any).window === "undefined") {
    (globalThis as any).window = globalThis;
}
if (typeof (globalThis as any).self === "undefined") {
    (globalThis as any).self = globalThis;
}
if (typeof (globalThis as any).navigator === "undefined") {
    (globalThis as any).navigator = { userAgent: "node" };
}
// ----------------------------------------------

import { createClient } from "@/utils/supabase/server";
import { getEmbedding } from "@/lib/openai/server";
import { chunkText } from "@/lib/rag/utils";
import { revalidatePath } from "next/cache";

// PDF parsing
const pdfParse = require("pdf-parse");
const pdf = pdfParse.default || pdfParse;

export async function getDocuments() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return { error: error.message };
        }

        return { data };
    } catch (err: any) {
        return { error: "Failed to fetch documents" };
    }
}

export async function getFileUrl(path: string) {
    if (!path) return null;
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 3600);
    if (error) {
        console.error("Error creating signed URL:", error);
        return null;
    }
    return data.signedUrl;
}

export async function uploadDocument(formData: FormData) {
    console.log("--- Starting Upload Process ---");
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        const file = formData.get("file") as File;
        if (!file) return { error: "No file provided" };
        console.log("File detected:", file.name, "(Size:", file.size, ")");

        // 1. PDF Parse
        let cleanText = "";
        try {
            console.log("Parsing PDF (with bypass)...");
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Bypass page rendering to avoid "j is not a function" error in some environments
            const data = await pdf(buffer, {
                pagerender: () => ""
            });

            cleanText = data.text.replace(/\s+/g, " ").trim();
            console.log("PDF parsed successfully. Text length:", cleanText.length);

            if (cleanText.length === 0) {
                console.warn("Warning: PDF text is empty.");
            }
        } catch (e: any) {
            console.error("PDF Parsing Error:", e.message);
            return { error: "Failed to parse PDF text for AI." };
        }

        // 2. Upload to Storage
        console.log("Uploading to storage...");
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);

        if (storageError) {
            console.error("Storage Error:", storageError.message);
            return { error: "Failed to upload file to storage. Did you run the SQL script I provided?" };
        }
        console.log("Storage upload success:", storageData.path);

        // 3. Insert to DB
        console.log("Inserting document record to DB...");
        const { data: doc, error: dbError } = await supabase
            .from("documents")
            .insert({
                title: file.name,
                content: cleanText,
                file_path: storageData.path,
                user_id: user.id
            })
            .select()
            .single();

        if (dbError) {
            console.error("DB Insert Error:", dbError.message);
            return { error: "Failed to save document record." };
        }
        console.log("DB record created. ID:", doc.id);

        // 4. Generate Embeddings (Optimized for Vercel)
        if (cleanText.length > 0) {
            try {
                console.log("Generating embeddings (Max 10 chunks)...");
                const chunks = chunkText(cleanText).slice(0, 10); // Limit to 10 chunks for stability

                const embeddingPromises = chunks.map(async (chunk) => {
                    try {
                        const embedding = await getEmbedding(chunk);
                        return {
                            document_id: doc.id,
                            content: chunk,
                            embedding,
                        };
                    } catch (e: any) {
                        console.error("Single chunk embedding error:", e.message);
                        return null;
                    }
                });

                const results = await Promise.all(embeddingPromises);
                const embeddingsData = results.filter((item): item is any => item !== null);

                if (embeddingsData.length > 0) {
                    const { error: embedError } = await supabase.from("document_embeddings").insert(embeddingsData);
                    if (embedError) {
                        console.error("Embedding Storage Error:", embedError.message);
                    } else {
                        console.log("Embeddings stored successfully:", embeddingsData.length);
                    }
                }
            } catch (e: any) {
                console.error("Overall Embedding Generation Error (Continuing anyway):", e.message);
            }
        }

        console.log("--- Process Completed Successfully ---");
        revalidatePath("/library");
        return { success: true };

    } catch (err: any) {
        console.error("Unexpected Error in uploadDocument:", err.message);
        return { error: err.message || "Something went wrong" };
    }
}

export async function deleteDocument(id: string, filePath: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        // 1. Delete from database
        const { error: dbError } = await supabase
            .from("documents")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (dbError) {
            return { error: "Failed to delete document from database." };
        }

        // 2. Delete from Storage
        if (filePath) {
            await supabase.storage
                .from("documents")
                .remove([filePath]);
        }

        revalidatePath("/library");
        return { success: true };
    } catch (err: any) {
        return { error: err.message || "Something went wrong" };
    }
}