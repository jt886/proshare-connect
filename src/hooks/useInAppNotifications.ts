'use client';

import { useState, useEffect } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';

export type InAppNotification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    link?: string;
    created_at: string;
};

export function useInAppNotifications() {
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data as InAppNotification[]);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications? 
        // Or maybe just rely on page refresh/user action for now to keep it simple and efficient.
        const interval = setInterval(fetchNotifications, 60000); // 1 minute
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await markAsRead(id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await markAllAsRead();
    };

    return { notifications, unreadCount, loading, refetch: fetchNotifications, markRead, markAllRead };
}
