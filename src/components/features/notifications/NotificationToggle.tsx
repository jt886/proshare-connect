'use client';

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationToggle() {
    const { isSupported, permission, subscribe, loading, subscription } = usePushNotifications();

    const handleSubscribe = async () => {
        const result = await subscribe();
        if (result) {
            toast.success("Notifications enabled!");
        } else {
            toast.error("Failed to enable notifications. Please check browser settings.");
        }
    };

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Your browser does not support push notifications.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const isEnabled = permission === 'granted' && !!subscription;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Push Notifications
                </CardTitle>
                <CardDescription>
                    Receive alerts about new trends and updates.
                    {!isEnabled && " (Tap Enable to start)"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant={isEnabled ? "outline" : "default"}
                    onClick={handleSubscribe}
                    disabled={loading || isEnabled || permission === 'denied'}
                    className="w-full"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isEnabled ? (
                        "Notifications Active"
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
