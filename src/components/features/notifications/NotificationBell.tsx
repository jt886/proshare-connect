'use client';

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Info } from "lucide-react";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, loading } = useInAppNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted/50"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 z-50 rounded-xl border bg-card text-card-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => markAllRead()} className="text-xs h-6 px-2">
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-[300px]">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground text-xs">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-xs">
                                No notifications yet
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "p-4 text-sm hover:bg-muted/50 transition-colors flex gap-3 relative",
                                            !n.is_read && "bg-muted/20"
                                        )}
                                        onClick={() => !n.is_read && markRead(n.id)}
                                    >
                                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0 opacity-0"
                                            style={{ opacity: n.is_read ? 0 : 1 }}
                                        />
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium leading-none">{n.title}</p>
                                            <p className="text-muted-foreground text-xs">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground/60 pt-1">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                            {n.link && (
                                                <Link href={n.link} className="absolute inset-0 z-10" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
