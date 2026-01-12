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
    // 1. ユーザー認証
    const supabase = await createClient();
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
        .from("community_messages")
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

    // 3. 通知処理を呼び出す
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.id)
            .single();

        const senderName = profile?.nickname || 'Someone';
        const shortMessage = content.length > 50 ? content.substring(0, 50) + '...' : content;

        console.log('sendMessageから通知呼び出し');
        // Fire-and-forget with catch
        sendBroadcastNotification(shortMessage, user.id, senderName)
            .catch(e => console.error('通知呼び出し失敗:', e));

    } catch (err) {
        console.error('Profile fetch or notification setup failed:', err);
    }

    // 4. 画面更新
    revalidatePath("/chat");
    return { success: true };
}