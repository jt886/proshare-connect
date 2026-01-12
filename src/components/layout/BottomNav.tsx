"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookOpen, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useChatUnread } from "@/hooks/useChatUnread"; // New hook

const navItems = [
    {
        href: "/home",
        icon: Home,
        label: "Home",
    },
    {
        href: "/research",
        icon: Search,
        label: "Research",
    },
    {
        href: "/chat",
        icon: MessageSquare,
        label: "Chat",
    },
    {
        href: "/library",
        icon: BookOpen,
        label: "Library",
    },
];

export function BottomNav() {
    const pathname = usePathname();
    const { unreadCount } = useChatUnread(); // Use the hook

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe">
            <div className="mx-auto flex h-16 items-center justify-around px-2">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center py-2 active:scale-95 transition-transform", // Increased touch target
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary/80"
                            )}
                            style={{ minHeight: "64px" }} // Ensure 44px+ touch target
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute top-1 h-1 w-12 rounded-full bg-primary"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            {/* Unread Badge (Real Logic) */}
                            {label === "Chat" && unreadCount > 0 && (
                                <div className="absolute left-[calc(50%+4px)] top-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm z-20 border border-background leading-tight">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </div>
                            )}
                            <Icon className={cn("h-6 w-6 mb-1 z-10", isActive && "fill-current")} />
                            <span className="text-[10px] font-medium z-10">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
