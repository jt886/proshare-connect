"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnreadMessageCount } from "@/app/(dashboard)/chat/community-actions";

const STORAGE_KEY = "chat_last_read_at";

export function useChatUnread() {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        // 1. Get last read time from local storage
        // Default to 7 days ago if never read (so we don't show 9999+ for new users)
        let lastRead = localStorage.getItem(STORAGE_KEY);
        if (!lastRead) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            lastRead = sevenDaysAgo.toISOString();
            localStorage.setItem(STORAGE_KEY, lastRead);
        }

        // 2. Ask server for count
        const { count } = await getUnreadMessageCount(lastRead);
        setUnreadCount(count || 0);
    }, []);

    // Initial fetch and poll on focus
    useEffect(() => {
        fetchUnreadCount();

        const onFocus = () => fetchUnreadCount();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [fetchUnreadCount]);

    const markAllAsRead = useCallback(() => {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        setUnreadCount(0);
    }, []);

    return {
        unreadCount,
        markAllAsRead,
        refresh: fetchUnreadCount
    };
}
