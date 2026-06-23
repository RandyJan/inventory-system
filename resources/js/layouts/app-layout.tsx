import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { type ReactNode, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({
    children,
    breadcrumbs,
    ...props
}: AppLayoutProps) {
    const { props: pageProps } = usePage();
    const userId = (pageProps.auth as any)?.user?.id;
    const lastFlashMessage = useRef<string | null>(null);

    const normalizeNotification = (notification: any) => {
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
    };

    // Flash message toasts
    useEffect(() => {
        const flashSuccess = pageProps.flash?.success;
        const flashError = pageProps.flash?.error;

        if (flashSuccess) {
            const flashKey = `success:${flashSuccess}`;

            if (lastFlashMessage.current !== flashKey) {
                toast.success(flashSuccess);
                lastFlashMessage.current = flashKey;
            }
        } else if (flashError) {
            const flashKey = `error:${flashError}`;

            if (lastFlashMessage.current !== flashKey) {
                toast.error(flashError);
                lastFlashMessage.current = flashKey;
            }
        } else {
            lastFlashMessage.current = null;
        }
    }, [pageProps.flash]);

    // Initialize global Reverb listener for real-time notifications
    useEffect(() => {
        if (!userId) {
            console.warn('AppLayout: userId not available');
            return;
        }

        try {
            // Reuse existing Echo instance if available
            let echoInstance = (window as any).Echo;

            if (!echoInstance) {
                console.log('Initializing new Echo instance...');
                window.Pusher = Pusher;

                echoInstance = new Echo({
                    broadcaster: 'reverb',
                    key: import.meta.env.VITE_REVERB_APP_KEY || 'local',
                    wsHost:
                        import.meta.env.VITE_REVERB_HOST ||
                        window.location.hostname,
                    wsPort: import.meta.env.VITE_REVERB_PORT
                        ? Number(import.meta.env.VITE_REVERB_PORT)
                        : import.meta.env.VITE_REVERB_SCHEME === 'https'
                          ? 443
                          : 80,
                    wssPort: import.meta.env.VITE_REVERB_PORT
                        ? Number(import.meta.env.VITE_REVERB_PORT)
                        : 443,
                    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
                    enabledTransports: ['ws', 'wss'],
                });

                (window as any).Echo = echoInstance;
            }

            // Set up connection status handlers
            if (echoInstance.connector?.socket) {
                echoInstance.connector.socket.on('connect', () => {
                    console.log('✓ Reverb connected');
                });

                echoInstance.connector.socket.on('disconnect', () => {
                    console.warn('✗ Reverb disconnected');
                });

                echoInstance.connector.socket.on('error', (error: any) => {
                    console.error('✗ Reverb connection error:', error);
                });
            }

            // Listen for real-time notifications
            const channel = echoInstance.private(
                `user.notifications.${userId}`,
            );

            channel.notification((notification: any) => {
                console.log(
                    '📬 Real-time notification received:',
                    notification,
                );

                const formatted = normalizeNotification(notification);

                // Notify all registered listeners (e.g., useNotifications hook)
                if (
                    window.notificationUpdates &&
                    Array.isArray(window.notificationUpdates)
                ) {
                    window.notificationUpdates.forEach((callback) => {
                        try {
                            callback(formatted);
                        } catch (error) {
                            console.error(
                                'Error in notification callback:',
                                error,
                            );
                        }
                    });
                }

                // Show toast immediately
                if (formatted.type === 'role_changed') {
                    toast.info('Role Updated', {
                        id: formatted.id,
                        description: [
                            formatted.old_role
                                ? `from ${formatted.old_role}`
                                : null,
                            formatted.new_role
                                ? `to ${formatted.new_role}`
                                : null,
                            formatted.changed_by
                                ? `by ${formatted.changed_by}`
                                : null,
                        ]
                            .filter(Boolean)
                            .join(' '),
                        duration: 5000,
                    });
                } else {
                    toast.info('New Notification', {
                        id: formatted.id,
                        description: formatted.user_name
                            ? `${formatted.user_name} sent you a notification`
                            : 'You have a new notification',
                        duration: 5000,
                    });
                }
            });

            channel.error((error: any) => {
                console.error('✗ Channel authorization error:', error);
            });

            // Cleanup on unmount
            return () => {
                echoInstance.leave(`user.notifications.${userId}`);
            };
        } catch (error) {
            console.error('Failed to initialize Reverb listener:', error);
        }
    }, [userId]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {/* Optional: remove this if using toast only */}
            {pageProps.flash?.success && (
                <div className="mx-4 mt-4 rounded-md bg-emerald-500 px-4 py-3 text-sm text-white shadow">
                    {pageProps.flash.success}
                </div>
            )}

            {pageProps.flash?.error && (
                <div className="mx-4 mt-4 rounded-md bg-red-500 px-4 py-3 text-sm text-white shadow">
                    {pageProps.flash.error}
                </div>
            )}

            <Toaster
                position="top-right"
                theme="system"
                richColors
                expand
                duration={5000}
            />

            {children}
        </AppLayoutTemplate>
    );
}
