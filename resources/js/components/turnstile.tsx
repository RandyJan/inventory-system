import { useEffect, useRef } from 'react';

interface TurnstileProps {
    readonly siteKey: string;
    readonly onVerify?: (token: string) => void;
    readonly onError?: () => void;
    readonly onExpire?: () => void;
    readonly theme?: 'light' | 'dark' | 'auto';
    readonly size?: 'normal' | 'compact';
    readonly tabIndex?: number;
}

declare global {
    interface Window {
        turnstile?: {
            render: (
                element: HTMLElement,
                options: {
                    sitekey: string;
                    callback?: (token: string) => void;
                    'error-callback'?: () => void;
                    'expired-callback'?: () => void;
                    theme?: 'light' | 'dark' | 'auto';
                    size?: 'normal' | 'compact';
                    tabindex?: number;
                },
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

export function Turnstile({
    siteKey,
    onVerify,
    onError,
    onExpire,
    theme = 'auto',
    size = 'normal',
    tabIndex,
}: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!containerRef.current || !siteKey) {
            return;
        }

        const renderTurnstile = () => {
            if (
                containerRef.current &&
                globalThis.window.turnstile &&
                !widgetIdRef.current
            ) {
                widgetIdRef.current = globalThis.window.turnstile.render(
                    containerRef.current,
                    {
                        sitekey: siteKey,
                        callback: onVerify,
                        'error-callback': onError,
                        'expired-callback': onExpire,
                        theme,
                        size,
                        tabindex: tabIndex,
                    },
                );
            }
        };

        // Check if Turnstile is already loaded
        if (globalThis.window.turnstile) {
            renderTurnstile();
        } else {
            // Load Turnstile script if not already loaded
            const script = document.createElement('script');
            script.src =
                'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            script.onload = renderTurnstile;
            document.head.appendChild(script);
        }

        // Cleanup
        return () => {
            if (widgetIdRef.current && globalThis.window.turnstile) {
                globalThis.window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, onVerify, onError, onExpire, theme, size, tabIndex]);

    return <div ref={containerRef} />;
}
