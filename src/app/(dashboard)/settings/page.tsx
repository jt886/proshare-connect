"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteAccount } from "./actions";
import { toast } from "sonner";
import { AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const handleDelete = async () => {
        if (confirmText !== "DELETE") {
            toast.error("Please type DELETE to confirm.");
            return;
        }

        if (!confirm("Are you really sure? This cannot be undone.")) return;

        setIsDeleting(true);
        const result = await deleteAccount();
        if (result?.error) {
            toast.error(result.error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-24 pt-safe max-w-md mx-auto">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/home">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>

            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="bg-destructive/10">
                    <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription className="text-destructive/80 font-medium">
                        Permanently delete your account and all associated data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            This action will immediately delete:
                        </p>
                        <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground ml-2">
                            <li>All uploaded documents and PDFs</li>
                            <li>Generated vector embeddings</li>
                            <li>Your user profile and settings</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-bold">Type "DELETE" below to confirm:</p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="w-full px-4 py-3 rounded-xl border border-destructive/20 bg-background text-base focus:ring-2 focus:ring-destructive focus:outline-none"
                        />
                        <Button
                            variant="destructive"
                            className="w-full h-12 text-base font-bold shadow-lg shadow-destructive/10"
                            disabled={isDeleting || confirmText !== "DELETE"}
                            onClick={handleDelete}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Deleting Account...
                                </>
                            ) : (
                                "Permanently Delete My Account"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center">
                <p className="text-xs text-muted-foreground opacity-50">
                    ProShare Connect v1.0.0
                </p>
            </div>
        </div>
    );
}
