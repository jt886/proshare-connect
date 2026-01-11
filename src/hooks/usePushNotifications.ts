'use client';

import { useState, useEffect } from 'react';
import { subscribeUser, unsubscribeUser } from '@/app/actions/notifications';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            registerServiceWorker();
        } else {
            setLoading(false);
        }
    }, []);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Error getting subscription', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async (): Promise<{ success: boolean; error?: string }> => {
        setLoading(true);
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                return { success: false, error: 'Permission denied by user' };
            }

            const registration = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidKey) {
                console.error("VAPID Key missing in env");
                return { success: false, error: 'Configuration Error: VAPID Key missing' };
            }

            let sub: PushSubscription | null = null;
            try {
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey),
                });
            } catch (subError: any) {
                console.error("PushManager Subscribe Error:", subError);
                return { success: false, error: `Browser Subscribe Failed: ${subError.message}` };
            }

            setSubscription(sub);

            // Serialize for server
            const subJSON = JSON.parse(JSON.stringify(sub));
            const serverResult = await subscribeUser(subJSON);

            if (serverResult.error) {
                return { success: false, error: `Server Save Failed: ${serverResult.error}` };
            }

            return { success: true };

        } catch (error: any) {
            console.error('Failed to subscribe', error);
            return { success: false, error: error.message || 'Unknown error occurred' };
        } finally {
            setLoading(false);
        }
    };

    return { isSupported, permission, subscription, subscribe, loading };
}
