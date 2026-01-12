'use server' // ★←この1行が絶対に必要です！一番上に書いてください

import webpush from 'web-push';
import { createClient } from '@/utils/supabase/server';

// ⚠️注意：ここには以前からある「saveSubscription」関数が必要です。
// もし「// ... (既存のコード...)」という日本語の文字だけになっていたら、
// それは消えてしまっているので、以下のコードを参考に復元してください。

export async function saveSubscription(subscription: any, userId: string) {
    // ... (元の保存処理) ...
    // もし元のコードが残っていれば、ここは触らなくてOKです！
    const supabase = createClient();
    await supabase.from('push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
    });
}

// ★追加した通知送信関数
export async function sendBroadcastNotification(message: string, senderId: string, senderNickname: string) {
    const supabase = createClient();

    // 1. 自分（送信者）以外の全ユーザーの購読情報を取得
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .neq('user_id', senderId);

    if (!subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found.');
        return;
    }

    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_MAILTO || 'example@test.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    );

    const notificationPayload = JSON.stringify({
        title: `新着メッセージ: ${senderNickname}`,
        body: message,
        url: '/chat',
    });

    const sendPromises = subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            }, notificationPayload);
        } catch (error) {
            console.error('Error sending notification:', error);
            if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
                await supabase.from('push_subscriptions').delete().match({ id: sub.id });
            }
        }
    });

    await Promise.all(sendPromises);
}