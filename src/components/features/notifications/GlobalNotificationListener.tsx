"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

import { usePathname } from "next/navigation";

export function GlobalNotificationListener() {
    // Prevent double subscription in strict mode
    const isSubscribed = useRef(false);
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    // Keep ref updated with latest pathname
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (isSubscribed.current) return;
        isSubscribed.current = true;

        const supabase = createClient();
        let channel: any = null;

        const setupListener = async () => {
            try {
                // Get current user to avoid notifying for own messages
                const { data: { user } } = await supabase.auth.getUser();
                const currentUserId = user?.id;

                channel = supabase
                    .channel("global_notifications")
                    .on(
                        "postgres_changes",
                        {
                            event: "INSERT",
                            schema: "public",
                            table: "community_messages",
                        },
                        async (payload: any) => {
                            const newMessage = payload.new;
                            // Ignore if no message or if it's our own
                            if (!newMessage || newMessage.user_id === currentUserId) return;

                            // Suppress notification if user is on the chat page
                            if (pathnameRef.current === "/chat") return;

                            // Fetch nickname for friendly notification
                            const { data: senderProfile } = await supabase
                                .from("profiles")
                                .select("nickname")
                                .eq("id", newMessage.user_id)
                                .single();

                            const senderName = senderProfile?.nickname || "Someone";

                            // Trigger global notification (Top-Center per layout config)
                            toast.info(senderName, {
                                description: newMessage.content,
                                duration: 4000,
                            });
                        }
                    )
                    .subscribe();

            } catch (error) {
                console.error("Global notification listener error:", error);
            }
        };

        setupListener();

        // Cleanup
        return () => {
            if (channel) supabase.removeChannel(channel);
            isSubscribed.current = false;
        };
    }, []);

    return null; // Logic only, no UI
}
