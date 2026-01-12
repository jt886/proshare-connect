"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCommunityMessages, sendCommunityMessage } from "@/app/(dashboard)/chat/community-actions";
import { useChatUnread } from "@/hooks/useChatUnread"; // New Hook
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
    const [isInitialized, setIsInitialized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const { markAllAsRead } = useChatUnread(); // Hook

    // 1. Load Cache on Mount
    useEffect(() => {
        const savedMessages = localStorage.getItem("community_chat_cache_v1");
        const savedDraft = localStorage.getItem("community_chat_draft_v1");

        // Mark as read when opening chat
        markAllAsRead();

        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) { console.error("Cache parse error", e); }
        }
        if (savedDraft) {
            setInput(savedDraft);
        }
        setIsInitialized(true);
    }, [markAllAsRead]);

    // 2. Save Cache on Update (only after init)
    useEffect(() => {
        if (isInitialized) {
            if (messages.length > 0) {
                localStorage.setItem("community_chat_cache_v1", JSON.stringify(messages));
            }
            localStorage.setItem("community_chat_draft_v1", input);
        }
    }, [messages, input, isInitialized]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getUser();

        const fetchMessages = async () => {
            const { data, error } = await getCommunityMessages();
            if (error) {
                console.error("Failed to load messages:", error);
                // User requested to suppress this error toast entirely
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

    // Scroll to bottom helper
    const scrollToBottom = (smooth = true) => {
        if (messageContainerRef.current) {
            const container = messageContainerRef.current;
            if (smooth) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            // Use setTimeout to ensure DOM is updated, especially for initial load
            const timer = setTimeout(() => {
                scrollToBottom(messages.length > 1);
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        // Toast for immediate feedback
        const toastId = toast.loading("Sending message...");

        const result = await sendCommunityMessage(input);

        if (result.error) {
            console.error("Send Message Error:", result.error);
            toast.dismiss(toastId);
            toast.error(result.error);
        } else {
            toast.dismiss(toastId);
            // toast.success("Sent!"); // Optional: overly noisy if chat is fast

            // Optimistic update
            // Even if currentUserId is missing (rare race condition), we show it as "Me"
            const optimisticId = currentUserId || "temp-me";
            const optimisticMsg: Message = {
                id: Date.now().toString(), // temp id
                user_id: optimisticId,
                user_email: "",
                content: input,
                created_at: new Date().toISOString(),
                profiles: {
                    nickname: "You",
                    avatar_url: null
                }
            };

            setMessages(prev => [...prev, optimisticMsg]);
            setInput("");
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-background font-sans" style={{ height: '100%', minHeight: 0 }}>
            {/* Scrollable Message Area */}
            <div
                ref={messageContainerRef}
                data-message-container
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4 space-y-4 overscroll-contain touch-auto"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    minHeight: 0,
                    maxHeight: '100%',
                    touchAction: 'pan-y'
                } as React.CSSProperties}
            >
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

            {/* Fixed Input Area */}
            <div className="flex-none p-4 border-t bg-background/80 backdrop-blur-md pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
