"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AIChat } from "@/components/features/chat/AIChat";
import { CommunityChat } from "@/components/features/chat/CommunityChat";
import { cn } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import { NicknameEditor } from "@/components/features/profile/NicknameEditor";

export default function ChatPage() {
    const [activeTab, setActiveTab] = useState<"ai" | "community">("ai");

    // Prevent body scroll when chat page is mounted
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPosition = window.getComputedStyle(document.body).position;
        const originalWidth = document.body.style.width;
        const originalHeight = document.body.style.height;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';

        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.position = originalPosition;
            document.body.style.width = originalWidth;
            document.body.style.height = originalHeight;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden bg-background flex flex-col items-center pt-16 pb-20">
            {/* Inner Content Container - Matches global max-width */}
            <div className="w-full max-w-md h-full flex flex-col px-4 overflow-hidden">
                {/* Header Area (Non-scrollable) */}
                <div className="flex flex-col shrink-0 bg-background z-10 pt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-foreground">Chat</h1>
                    </div>

                    <div className="mb-4">
                        <NicknameEditor />
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-secondary/30 p-1.5 rounded-2xl mb-4">
                        <button
                            onClick={() => setActiveTab("ai")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]",
                                activeTab === "ai"
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <MessageSquare className="h-4 w-4" />
                            AI Assistant
                        </button>
                        <button
                            onClick={() => setActiveTab("community")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98]",
                                activeTab === "community"
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground/80"
                            )}
                        >
                            <Users className="h-4 w-4" />
                            Community
                        </button>
                    </div>
                </div>

                {/* Chat Area (Scrollable) */}
                <Card className="flex-1 flex flex-col overflow-hidden min-h-0 border-0 rounded-none md:border md:rounded-2xl shadow-none md:shadow-md bg-transparent">
                    <div className="flex-1 relative h-full overflow-hidden">
                        {/* We need to ensure the inner chat component handles the scrolling with overflow-y-auto */}
                        {activeTab === "ai" ? <AIChat /> : <CommunityChat />}
                    </div>
                </Card>
            </div>
        </div>
    );
}
