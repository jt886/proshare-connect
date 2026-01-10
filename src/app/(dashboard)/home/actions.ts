"use server";

import { createClient } from "@/utils/supabase/server";

export async function getTeamMembers() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, avatar_url, role")
        .limit(10);

    if (error) {
        console.error("Error fetching team members:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        return { error: error.message };
    }
    return { data };
}

export async function updateNickname(nickname: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("profiles")
        .update({ nickname })
        .eq("id", user.id);

    if (error) {
        console.error("Error updating nickname:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        return { error: error.message };
    }

    return { success: true };
}

export async function getCurrentProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return data;
}
