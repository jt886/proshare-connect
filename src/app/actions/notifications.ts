'use server';

import webpush from 'web-push';
import { createClient } from '@/utils/supabase/server';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@proshare.connect',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

// --- Push Subscription Management ---

export async function subscribeUser(sub: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check if subscription already exists
    const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', sub.endpoint)
        .single();

    if (existing) {
        return { success: true, message: 'Already subscribed' };
    }

    const { error } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: sub.endpoint,
        auth_key: sub.keys.auth,
        p256dh_key: sub.keys.p256dh,
    });

    if (error) {
        console.error('Error saving subscription:', error);
        return { error: 'Failed to save subscription' };
    }

    return { success: true };
}

export async function unsubscribeUser() {
    // In a real app, you might want to pass the endpoint to delete a specific one
    // For now, we'll just return success as the logic handles mostly on client side clearing
    return { success: true };
}

// --- Notification Sending (Internal / Admin) ---

export async function sendPushNotification(userId: string, title: string, body: string, url: string = '/') {
    const supabase = await createClient();

    // 1. Save to In-App History
    try {
        await supabase.from('notifications').insert({
            user_id: userId,
            title,
            message: body,
            link: url,
        });
    } catch (e) {
        console.error('Error saving in-app notification:', e);
    }

    // 2. Send to all user's devices
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) {
        return { success: false, message: 'No subscriptions found' };
    }

    const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-v2-192x192.png',
        url,
    });

    const results = await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.auth_key,
                            p256dh: sub.p256dh_key,
                        },
                    },
                    payload
                );
                return { success: true };
            } catch (error: any) {
                console.error('Error sending push:', error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription/Endpoint is gone, delete it
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
                return { success: false, error };
            }
        })
    );

    return { success: true, results };
}

/**
 * Broadcasts a push notification to all users EXCEPT the sender.
 * Note: Does not save to 'notifications' table to avoid spamming usage history.
 */
export async function sendBroadcastNotification(message: string, senderId: string, senderNickname: string) {
    const supabase = await createClient();

    // 1. Fetch all subscriptions EXCEPT the sender
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', senderId);

    if (!subscriptions || subscriptions.length === 0) {
        return { success: true, message: 'No recipients found' };
    }

    // 2. Prepare Payload
    const payload = JSON.stringify({
        title: `新着メッセージ: ${senderNickname}`,
        body: message,
        icon: '/icon-v2-192x192.png',
        url: '/chat',
    });

    // 3. Send in parallel
    const results = await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.auth_key,
                            p256dh: sub.p256dh_key,
                        },
                    },
                    payload
                );
                return { success: true };
            } catch (error: any) {
                // Cleanup if invalid
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                }
                return { success: false, error };
            }
        })
    );

    return { success: true, count: results.length };
}


// --- In-App Notification Management ---

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    return data || [];
}

export async function markAsRead(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

    return { success: !error };
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

    return { success: true };
}