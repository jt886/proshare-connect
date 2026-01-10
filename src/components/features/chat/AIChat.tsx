"use client";

import { useState, useEffect, useRef } from "react";
import { chatWithRAG } from "@/app/(dashboard)/chat/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hello! I am your AI assistant. I can help you research and answer questions based on your library documents. What would you like to know?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const result = await chatWithRAG([...messages, userMessage]);
            if (!result) {
                toast.error("AI returned no response");
            } else if (result.error) {
                toast.error(result.error);
            } else if (result.data) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 2).toString(),
                        role: "assistant",
                        content: result.data || "I'm sorry, I couldn't generate a response.",
                    },
                ]);
            }
        } catch (error) {
            toast.error("Failed to get response from AI");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background font-sans">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-secondary text-secondary-foreground shadow-none"
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content}
                            </p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-secondary/50 rounded-2xl px-5 py-3 animate-pulse flex items-center gap-3">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Thinking</span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 border-t bg-background/80 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask AI about documents..."
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
