"use server";

import { createClient } from "@/utils/supabase/server";
import { getEmbedding } from "@/lib/openai/server";
import { chunkText } from "@/lib/rag/utils";
import { revalidatePath } from "next/cache";

// PDF parsing
const pdfParse = require("pdf-parse");
const pdf = pdfParse.default || pdfParse;

// Polyfill for DOMMatrix which is missing in Node environment but required by some PDF.js versions
if (typeof (global as any).DOMMatrix === "undefined") {
    (global as any).DOMMatrix = class DOMMatrix {
        constructor() { }
    };
}

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
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Unauthorized" };

        const file = formData.get("file") as File;
        if (!file) return { error: "No file provided" };

        // 1. PDF Parse & Embeddings (RAG)
        let cleanText = "";
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const data = await pdf(buffer);
            cleanText = data.text.replace(/\s+/g, " ").trim();
        } catch (e: any) {
            return { error: "Failed to parse PDF text for AI." };
        }

        // 2. Upload to Storage
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
            .from("documents")
            .upload(fileName, file);

        if (storageError) {
            return { error: "Failed to upload file to storage." };
        }

        // 3. Insert to DB
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
            return { error: "Failed to save document record." };
        }

        // 4. Generate Embeddings (Background-ish)
        try {
            const chunks = chunkText(cleanText);
            const embeddingPromises = chunks.map(async (chunk) => {
                const embedding = await getEmbedding(chunk);
                return {
                    document_id: doc.id,
                    content: chunk,
                    embedding,
                };
            });
            const embeddingsData = await Promise.all(embeddingPromises);
            await supabase.from("document_embeddings").insert(embeddingsData);
        } catch (e: any) {
            console.error("Embedding Generation Error:", e.message);
        }

        revalidatePath("/library");
        return { success: true };

    } catch (err: any) {
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