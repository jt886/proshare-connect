'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendBroadcastNotification } from '@/app/actions/notifications';
// もし generateEmbedding 等を使っている場合は、以下のようにコメントアウトを外すか、必要なimportを追加してください
// import { generateEmbedding } from "@/utils/ai/vector-service"; 

export async function sendMessage(formData: FormData) {
    const supabase = createClient();

    // 1. ユーザー認証
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // 2. メッセージ取得
    const message = formData.get('message') as string;
    if (!message) {
        return { error: 'Message is empty' };
    }

    // 3. データベースに保存
    const { error } = await supabase.from('messages').insert({
        content: message,
        user_id: user.id,
    });

    if (error) {
        console.error('Error saving message:', error);
        return { error: error.message };
    }

    // 4. 全員へプッシュ通知を送る（新機能）
    try {
        // ニックネームを取得
        const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.id)
            .single();

        const nickname = profile?.nickname || '誰か';

        // 通知送信 (エラーでもチャット自体は止めない)
        await sendBroadcastNotification(message, user.id, nickname);

    } catch (err) {
        console.error('Notification failed:', err);
    }

    // 5. 画面更新
    revalidatePath('/chat');
    return { success: true };
}