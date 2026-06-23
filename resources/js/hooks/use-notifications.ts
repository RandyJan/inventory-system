import { useCallback, useEffect, useState } from 'react';

export interface Notification {
    id: string;
    type: string;
    user_id: number;
    user_name: string;
    old_role?: string | null;
    new_role?: string | null;
    changed_by: string;
    read_at?: string | null;
    created_at: string;
}

function normalizeNotification(notification: any): Notification {
    const payload = notification?.data ?? notification;

    return {
        id: notification?.id ?? payload?.id ?? `${Date.now()}`,
        type: payload?.type ?? 'general',
        user_id: payload?.user_id ?? 0,
        user_name: payload?.user_name ?? '',
        old_role: payload?.old_role ?? null,
        new_role: payload?.new_role ?? null,
        changed_by: payload?.changed_by ?? '',
        read_at: notification?.read_at ?? null,
        created_at:
            notification?.created_at ??
            payload?.changed_at ??
            new Date().toISOString(),
    };
}

declare global {
    interface Window {
        Echo?: any;
        notificationUpdates?: ((notification: Notification) => void)[];
    }
}

export function useNotifications(userId?: number) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const loadNotifications = useCallback(() => {
        fetch('/notifications/latest')
            .then((res) => res.json())
            .then((data) => {
                setNotifications(
                    data.map((n: any) => normalizeNotification(n)),
                );
            })
            .catch((error) => {
                console.error('Failed to load notifications:', error);
            });
    }, []);

    // Load initial notifications
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Register callback for real-time notification updates
    useEffect(() => {
        if (!userId) {
            return;
        }

        const handleNewNotification = () => {
            loadNotifications();
        };

        // Store callback in window for global listener to call
        if (!window.notificationUpdates) {
            window.notificationUpdates = [];
        }
        window.notificationUpdates.push(handleNewNotification);

        // Cleanup
        return () => {
            window.notificationUpdates = window.notificationUpdates?.filter(
                (cb) => cb !== handleNewNotification,
            );
        };
    }, [loadNotifications, userId]);

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return {
        notifications,
        unreadCount,
    };
}
