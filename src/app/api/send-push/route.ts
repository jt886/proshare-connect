
import { type NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// ... (existing imports)

export async function POST(req: NextRequest) {
    try {
        const { userId, message } = await req.json();

        // Use Service Role to bypass RLS for this admin/test endpoint
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch subscriptions for the user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ error: 'No subscriptions found', details: error }, { status: 404 });
        }

        const payload = JSON.stringify({
            title: 'Test Notification',
            body: message,
            icon: '/icon-v2-192x192.png',
            url: '/',
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
                    return { success: true, endpoint: sub.endpoint };
                } catch (err: any) {
                    console.error('Push error:', err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Cleanup invalid subscription
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                    return { success: false, error: err.message };
                }
            })
        );

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

// update
// update