"use client";

import { useEffect, useState } from "react";
import { uploadDocument, getDocuments, getFileUrl, deleteDocument } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, Upload, ExternalLink, Trash2 } from "lucide-react";

export default function LibraryPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);

    const fetchDocs = async () => {
        const { data, error } = await getDocuments();
        if (error) {
            toast.error("Failed to load documents");
        } else {
            setDocuments(data || []);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleOpenDoc = async (path: string) => {
        if (!path) return;
        try {
            const url = await getFileUrl(path);
            if (url) {
                window.open(url, "_blank");
            } else {
                toast.error("Could not generate download link.");
            }
        } catch (e) {
            toast.error("Error opening document.");
        }
    };

    const handleDelete = async (id: string, path: string) => {
        if (!confirm("Are you sure you want to delete this document?")) return;

        setIsDeleting(id);
        const result = await deleteDocument(id, path);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Document deleted.");
            fetchDocs();
        }
        setIsDeleting(null);
    };

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUploading(true);

        const formData = new FormData(e.currentTarget);
        const result = await uploadDocument(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Document uploaded and indexed!");
            fetchDocs();
        }
        setIsUploading(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="space-y-6 pb-24 pt-safe">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Knowledge Library</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add New Document</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="pdf">PDF Document</Label>
                            <Input id="pdf" name="file" type="file" accept=".pdf" required
                                className="h-12 py-3"
                            />
                        </div>
                        <Button disabled={isUploading} className="w-full h-12 text-base">
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-5 w-5" />
                                    Upload & Index
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Documents</h2>
                {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No documents found. Upload one to get started.
                    </p>
                ) : (
                    <div className="grid gap-3">
                        {documents.map((doc) => (
                            <Card
                                key={doc.id}
                                className="w-full max-w-full p-4 min-h-20 flex items-center justify-between gap-4 active:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => handleOpenDoc(doc.file_path || doc.storage_path)}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0 max-w-full overflow-hidden">
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                                        <FileText className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
                                        <p className="font-semibold text-base truncate max-w-full break-all">{doc.title || doc.name || "Untitled Document"}</p>
                                        <p className="text-sm text-muted-foreground truncate">{new Date(doc.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(doc.id, doc.file_path || doc.storage_path);
                                        }}
                                        disabled={isDeleting === doc.id}
                                    >
                                        {isDeleting === doc.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-6 w-6" />
                                        )}
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}
