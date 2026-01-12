"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generateEmbedding } from "@/utils/ai/vector-service";
import { sendBroadcastNotification } from "@/app/actions/notifications";

export async function getCommunityMessages() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("community_messages")
        .select(`
            *,
            profiles:user_id (nickname, avatar_url)
        `)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching community messages:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        return { error: error.message };
    }
    return { data };
}

export async function sendCommunityMessage(content: string) {
    const supabase = await createClient();

    // 1. ユーザー認証
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Unauthorized" };
    }

    let embedding: number[] | null = null;
    try {
        // Auto-learning: Vectorize the message content
        embedding = await generateEmbedding(content.trim());
    } catch (e) {
        console.error("Failed to generate embedding for chat:", e);
    }

    // 2. データベースに保存
    const { error } = await supabase
        .from("community_messages") // Using correct table name
        .insert({
            user_id: user.id,
            user_email: user.email,
            content: content.trim(),
            embedding: embedding
        });

    if (error) {
        console.error("Error sending community message:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        return { error: error.message };
    }

    // 3. 通知を送信（エラーが起きてもチャットは止めない）
    // Fire-and-forget logic using immediately invoked async function
    (async () => {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', user.id)
                .single();

            const senderName = profile?.nickname || 'Someone';
            // Truncate long messages
            const shortMessage = content.length > 50 ? content.substring(0, 50) + '...' : content;

            // 自分以外の全ユーザーへ通知
            await sendBroadcastNotification(shortMessage, user.id, senderName);

        } catch (err) {
            console.error('Notification failed:', err);
        }
    })();

    // 4. 画面更新
    revalidatePath("/chat");
    return { success: true };
}