"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ResetAppButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm("This will refresh the app to the latest version. Continue?")) return;

        setIsLoading(true);
        try {
            // 1. Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // 2. Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
            }

            toast.success("App reset successfully! Reloading...");

            // 3. Force reload from server
            setTimeout(() => {
                window.location.href = window.location.href; // safer reload than location.reload(true) in some browsers
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Reset failed:", error);
            toast.error("Failed to reset. Please try manually clearing browser data.");
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Updating..." : "Force Update App"}
        </Button>
    );
}
