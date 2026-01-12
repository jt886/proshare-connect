'use server';

import webpush from 'web-push';
import { createClient } from '@/utils/supabase/server';

// --- Push Subscription Management (Preserved) ---

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
    return { success: true };
}

// --- Notification Sending (Debug Version) ---

export async function sendBroadcastNotification(message: string, senderId: string, senderNickname: string) {
    console.log('--- 通知処理開始 ---');
    const supabase = createClient(); // Note: createClient() for server actions usually needs 'await' in strict implementations but client provided synchronous usage in snippet. In 'utils/supabase/server', it is async? 
    // Checking `src/utils/supabase/server.ts` imports... Usually it is async `await createClient()`. 
    // However, I will check the file content first in next step or assume async. 
    // Code snippet provided by user: `const supabase = createClient();` (no await).
    // I will check if I should use await. PROBABLY YES.
    // Wait, I will use `await createClient()` to be safe, or check imports.
    // Actually, standard Next.js supabase server client instructions use await cookies().
    // Using `await createClient()` is safer.

    const sb = await createClient(); // Using variable sb to avoid confusion or modification of user snippet excess

    const { data: subscriptions, error: dbError } = await sb
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', senderId);

    if (dbError) {
        console.error('DB取得エラー:', dbError);
        return;
    }

    console.log(`送信対象者数: ${subscriptions?.length || 0}名`);

    if (!subscriptions || subscriptions.length === 0) return;

    // 環境変数のチェックログ
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.error('エラー: VAPIDキーが環境変数に設定されていません！');
        return;
    }

    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_MAILTO || 'example@test.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
        title: `${senderNickname}さんからのメッセージ`,
        body: message,
        url: '/chat',
        icon: '/icon-v2-192x192.png'
    });

    await Promise.all(subscriptions.map(async (sub) => {
        try {
            // FIX logic: DB uses p256dh_key, auth_key. User snippet used p256dh, auth.
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
            }, payload);
            console.log(`送信成功: ${sub.user_id}`);
        } catch (error: any) {
            console.error(`送信失敗 (${sub.user_id}):`, error.statusCode, error.message);
            if (error.statusCode === 410 || error.statusCode === 404) {
                await sb.from('push_subscriptions').delete().eq('id', sub.id);
                console.log('無効な購読情報を削除しました');
            }
        }
    }));
    console.log('--- 通知処理終了 ---');
}

// --- In-App Notification Helpers (Preserved) ---

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