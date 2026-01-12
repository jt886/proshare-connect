'use client';

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationToggle() {
    const { isSupported, permission, subscribe, unsubscribe, loading, subscription } = usePushNotifications();

    const handleToggle = async () => {
        if (isEnabled) {
            await unsubscribe();
            toast.success("Notifications disabled.");
        } else {
            const result = await subscribe();
            if (result.success) {
                toast.success("Notifications enabled!");
            } else {
                toast.error(result.error || "Failed to enable notifications.");
            }
        }
    };

    if (!isSupported) {
        // ... (keep existing)
    }

    const isEnabled = permission === 'granted' && !!subscription;

    return (
        <Card>
            <CardHeader>
                {/* ... (keep existing) */}
            </CardHeader>
            <CardContent>
                <Button
                    variant={isEnabled ? "outline" : "default"}
                    onClick={handleToggle}
                    disabled={loading || permission === 'denied'}
                    className="w-full"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isEnabled ? (
                        "Disable Notifications"
                    ) : permission === 'denied' ? (
                        "Permission Denied (Check Settings)"
                    ) : (
                        "Enable Notifications"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
