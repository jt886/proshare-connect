"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCommunityMessages, sendCommunityMessage } from "@/app/(dashboard)/chat/community-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
    id: string;
    user_id: string;
    user_email: string;
    content: string;
    created_at: string;
    profiles?: {
        nickname: string | null;
        avatar_url: string | null;
    };
}

export function CommunityChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getUser();

        const fetchMessages = async () => {
            const { data, error } = await getCommunityMessages();
            if (error) {
                toast.error("Failed to load messages");
            } else if (data) {
                setMessages(data as Message[]);
            }
        };
        fetchMessages();

        const channel = supabase
            .channel("community_chat")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "community_messages",
                },
                async (payload: any) => {
                    const newMessage = payload.new;
                    if (!newMessage) return;

                    // Fetch the profile for the new message
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("nickname, avatar_url")
                        .eq("id", newMessage.user_id)
                        .single();

                    setMessages((prev) => {
                        // DEDUPLICATION LOGIC:
                        // Check if we have a pending optimistic message from this user with the same content
                        // We assume the optimistic message is the one with a non-UUID id (e.g. timestamp)
                        const optimisticMatchIndex = prev.findIndex(msg =>
                            msg.user_id === newMessage.user_id &&
                            msg.content === newMessage.content &&
                            msg.id.length < 20 // timestamp IDs are shorter than UUIDs
                        );

                        if (optimisticMatchIndex !== -1) {
                            // Replace optimistic message with real one
                            const newMessages = [...prev];
                            newMessages[optimisticMatchIndex] = { ...newMessage, profiles: profile };
                            return newMessages;
                        }

                        // Otherwise append as normal
                        // Also check for real duplicate (UUID match) just in case
                        if (prev.some(msg => msg.id === newMessage.id)) return prev;

                        return [...prev, { ...newMessage, profiles: profile }];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]); // Add currentUserId to dependency array for correct matching

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        const result = await sendCommunityMessage(input);
        console.log("Send Message Result:", result);
        if (result.error) {
            console.error("Send Message Error:", result.error);
            toast.error(result.error);
        } else {
            // Optimistic update (or manual append to ensure visibility)
            if (currentUserId) {
                const optimisticMsg: Message = {
                    id: Date.now().toString(), // temp id
                    user_id: currentUserId,
                    user_email: "", // Not needed for display if we have ID
                    content: input,
                    created_at: new Date().toISOString(),
                    profiles: {
                        nickname: "You", // Or fetch current profile nickname if available
                        avatar_url: null
                    }
                };
                // Only append if not already added by realtime (duplicates handled by key usually, but simple append is safe for UX)
                // Realtime might duplicate it, but we can de-dupe later if needed. For now, visibility is priority.
                // Better approach: fetch latest or rely on realtime. But user said "nothing happens".
                // Let's just clear input for now, but if we want to show it:
                setMessages(prev => [...prev, optimisticMsg]);
            }
            setInput("");
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-background font-sans">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId;
                    const displayName = msg.profiles?.nickname || msg.user_email?.split("@")[0] || "Unknown User";

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-secondary-foreground shadow-none"
                                    }`}
                            >
                                {!isMe && (
                                    <p className="text-[10px] font-bold opacity-70 mb-1 truncate text-primary/80 uppercase tracking-tighter">
                                        {displayName}
                                    </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                                    <p className="text-[9px]">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t bg-background/80 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Write to community..."
                        className="flex-1 h-12 rounded-xl bg-secondary/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 rounded-xl shrink-0 transition-all active:scale-95"
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
