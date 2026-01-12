'use server';

import webpush from 'web-push';
import { createClient } from '@/utils/supabase/server'; // User context client (cookies)
import { createClient as createAdminClient } from '@supabase/supabase-js'; // Admin client (service role)

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

// --- Notification Sending (Admin / Broadcast) ---

export async function sendBroadcastNotification(message: string, senderId: string, senderNickname: string) {
    console.log('--- 通知処理開始 (Admin Mode) ---');

    // Use Service Role Client to bypass RLS and fetch ALL subscriptions
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subscriptions, error: dbError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', senderId);

    if (dbError) {
        console.error('DB取得エラー:', dbError);
        return;
    }

    console.log(`送信対象者数: ${subscriptions?.length || 0}名`);

    if (!subscriptions || subscriptions.length === 0) {
        console.log('送信対象が存在しなかったため終了します。');
        return;
    }

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
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
            }, payload);
            console.log(`送信成功: ${sub.user_id}`);
        } catch (error: any) {
            console.error(`送信失敗 (${sub.user_id}):`, error.statusCode, error.message);
            if (error.statusCode === 410 || error.statusCode === 404) {
                await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
                console.log('無効な購読情報を削除しました');
            }
        }
    }));
    console.log('--- 通知処理終了 ---');
}

// --- In-App Notification Helpers (Preserved) ---

export async function getNotifications() {
    const supabase = await createClient(); // Use cookie client for user data
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