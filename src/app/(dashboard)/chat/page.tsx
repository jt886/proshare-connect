"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AIChat } from "@/components/features/chat/AIChat";
import { CommunityChat } from "@/components/features/chat/CommunityChat";
import { cn } from "@/lib/utils";
import { MessageSquare, Users } from "lucide-react";
import { NicknameEditor } from "@/components/features/profile/NicknameEditor";

export default function ChatPage() {
    const [activeTab, setActiveTab] = useState<"ai" | "community">("ai");

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">Chat</h1>
            </div>

            <div className="mb-4">
                <NicknameEditor />
            </div>

            {/* Tab Switched */}
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

            <Card className="flex-1 flex flex-col overflow-hidden min-h-0 border-0 rounded-none md:border md:rounded-2xl shadow-none md:shadow-md bg-transparent">
                <div className="flex-1 relative">
                    {activeTab === "ai" ? <AIChat /> : <CommunityChat />}
                </div>
            </Card>
        </div>
    );
}
