import AppLogoIcon from '@/components/app-logo-icon';
import { type GlobalEvent } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const loadingDelayInMs = 120;
const loadingFallbackInMs = 10000;
const loadingStartedEvent = 'stockmaster:loading-start';

export function showGlobalLoadingIndicator() {
    window.dispatchEvent(new CustomEvent(loadingStartedEvent));
}

export function GlobalLoadingIndicator() {
    const [isVisible, setIsVisible] = useState(false);
    const pendingTimer = useRef<number | null>(null);
    const fallbackTimer = useRef<number | null>(null);

    useEffect(() => {
        const clearPendingTimer = () => {
            if (pendingTimer.current) {
                window.clearTimeout(pendingTimer.current);
                pendingTimer.current = null;
            }
        };

        const clearFallbackTimer = () => {
            if (fallbackTimer.current) {
                window.clearTimeout(fallbackTimer.current);
                fallbackTimer.current = null;
            }
        };

        const showLoader = (event: GlobalEvent<'start'>) => {
            if (
                event.detail.visit.prefetch ||
                !event.detail.visit.showProgress
            ) {
                return;
            }

            clearPendingTimer();

            pendingTimer.current = window.setTimeout(() => {
                setIsVisible(true);
            }, loadingDelayInMs);
        };

        const hideLoader = () => {
            clearPendingTimer();
            clearFallbackTimer();

            setIsVisible(false);
        };

        const showLoaderImmediately = () => {
            clearPendingTimer();
            clearFallbackTimer();

            setIsVisible(true);

            fallbackTimer.current = window.setTimeout(() => {
                setIsVisible(false);
                fallbackTimer.current = null;
            }, loadingFallbackInMs);
        };

        const removeStartListener = router.on('start', showLoader);
        const removeFinishListener = router.on('finish', hideLoader);
        const removeNavigateListener = router.on('navigate', hideLoader);

        window.addEventListener(loadingStartedEvent, showLoaderImmediately);

        return () => {
            removeStartListener();
            removeFinishListener();
            removeNavigateListener();
            window.removeEventListener(
                loadingStartedEvent,
                showLoaderImmediately,
            );
            hideLoader();
        };
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            aria-live="polite"
            aria-busy="true"
            className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center bg-background/35 px-4 pt-4 backdrop-blur-[2px] transition-opacity sm:pt-6"
        >
            <div className="w-full max-w-sm overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="h-1 overflow-hidden bg-muted">
                    <div className="h-full w-2/5 animate-[stockmaster-loading_1.15s_ease-in-out_infinite] rounded-r-full bg-primary motion-reduce:w-full motion-reduce:animate-none" />
                </div>

                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary">
                        <AppLogoIcon className="size-7 object-contain" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm leading-none font-medium">
                            Loading StockMaster
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Preparing your workspace...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
