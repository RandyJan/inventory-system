import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function DebugNotifications() {
    const { auth } = usePage().props;
    const userId = (auth as any)?.user?.id;
    const [status, setStatus] = useState('Checking...');
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const logs: string[] = [];

        // Check Reverb environment variables
        logs.push(`✓ User ID: ${userId}`);
        logs.push(`✓ VITE_REVERB_HOST: ${import.meta.env.VITE_REVERB_HOST || 'not set'}`);
        logs.push(`✓ VITE_REVERB_PORT: ${import.meta.env.VITE_REVERB_PORT || 'not set'}`);
        logs.push(`✓ VITE_REVERB_SCHEME: ${import.meta.env.VITE_REVERB_SCHEME || 'not set'}`);
        logs.push(`✓ VITE_REVERB_APP_KEY: ${import.meta.env.VITE_REVERB_APP_KEY || 'not set'}`);

        setLogs(logs);

        if (!userId) {
            setStatus('ERROR: User ID not available');
            return;
        }

        // Test connection
        const testConnection = async () => {
            try {
                logs.push('');
                logs.push('--- Echo Connection Test ---');
                
                // Simulate loading the hook
                const script = document.createElement('script');
                script.type = 'module';
                script.innerHTML = `
                    import Echo from 'laravel-echo';
                    import Pusher from 'pusher-js';

                    window.Pusher = Pusher;
                    const echo = new Echo({
                        broadcaster: 'reverb',
                        key: '${import.meta.env.VITE_REVERB_APP_KEY || 'local'}',
                        wsHost: '${import.meta.env.VITE_REVERB_HOST || window.location.hostname}',
                        wsPort: ${import.meta.env.VITE_REVERB_PORT ? Number(import.meta.env.VITE_REVERB_PORT) : '80'},
                        wssPort: 443,
                        forceTLS: false,
                        enabledTransports: ['ws', 'wss'],
                    });

                    echo.connector.socket?.on('connect', () => {
                        console.log('✓ WebSocket connected');
                        window.reverbStatus = 'connected';
                    });

                    echo.connector.socket?.on('disconnect', () => {
                        console.log('✗ WebSocket disconnected');
                        window.reverbStatus = 'disconnected';
                    });

                    echo.connector.socket?.on('error', (error) => {
                        console.error('✗ WebSocket error:', error);
                        window.reverbStatus = 'error';
                    });

                    window.testEcho = echo;
                `;

                logs.push('✓ Echo instance created');
                setLogs([...logs]);
            } catch (error) {
                logs.push(`✗ Error: ${error}`);
                setLogs([...logs]);
            }
        };

        testConnection();
    }, [userId]);

    const sendTestNotification = async () => {
        try {
            const response = await fetch('/api/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                const error = await response.text();
                setStatus(`✗ Error: ${response.status} - ${error}`);
            } else {
                setStatus('✓ Test notification sent!');
                setLogs((prev) => [
                    ...prev,
                    '',
                    `[${new Date().toLocaleTimeString()}] Test notification sent - watch for toast above!`,
                ]);
            }
        } catch (error) {
            setStatus(`✗ Connection error: ${error}`);
        }
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Debug', href: '#' }, { label: 'Notifications', href: '#' }]}>
            <div className="space-y-6 p-6">
                <div className="rounded-lg border border-border bg-card p-6">
                    <h1 className="text-2xl font-bold mb-4">Reverb Notification Debugger</h1>

                    <div className="space-y-4">
                        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/30">
                            <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Status</h2>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{status}</p>
                        </div>

                        <div className="rounded-md bg-muted p-4">
                            <h2 className="font-semibold mb-2">Configuration</h2>
                            <pre className="text-xs overflow-auto">
                                {logs.map((log, i) => (
                                    <div key={i} className="font-mono text-muted-foreground">
                                        {log}
                                    </div>
                                ))}
                            </pre>
                        </div>

                        <button
                            onClick={sendTestNotification}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Send Test Notification
                        </button>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>ℹ️ Reverb WebSocket server should be running on port 8080</p>
                            <p>ℹ️ Check browser DevTools Console for WebSocket connection logs</p>
                            <p>ℹ️ Look for "ws://localhost:8080" connection messages</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
