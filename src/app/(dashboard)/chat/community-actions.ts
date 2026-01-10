"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("community_messages")
        .insert({
            user_id: user.id,
            user_email: user.email,
            content: content.trim()
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

    revalidatePath("/chat");
    return { success: true };
}
