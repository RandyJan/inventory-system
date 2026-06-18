import PrivacyNoticeContent from '@/components/privacy-notice/privacy-notice-content';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLogoIcon from '@/components/app-logo-icon';
import { X } from 'lucide-react';

interface PrivacyNoticeDialogProps {
    readonly trigger?: React.ReactNode;
    readonly triggerClassName?: string;
    readonly onAccept?: () => void;
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
}

export default function PrivacyNoticeDialog({
    trigger = 'View Privacy Notice',
    triggerClassName = 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline',
    onAccept,
    open,
    onOpenChange,
}: PrivacyNoticeDialogProps) {
    const handleAccept = () => {
        onAccept?.();
        onOpenChange?.(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {typeof trigger === 'string' ? (
                    <Button variant="link" className={triggerClassName}>
                        {trigger}
                    </Button>
                ) : (
                    trigger
                )}
            </DialogTrigger>
            <DialogContent className="!h-[75vh] !w-[75vw] !max-w-[75vw] !max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-950">
                <DialogHeader className="flex flex-row items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <AppLogoIcon className="size-8 h-8 w-8 fill-current text-blue-800 dark:text-white" />
                        <div>
                            <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase dark:text-slate-400">
                                Policy Notice
                            </p>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Privacy Notice
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="sr-only">
                        Read our privacy notice and data handling practices
                    </DialogDescription>
                </DialogHeader>

                <div className="pr-2 sm:pr-3">
                    <PrivacyNoticeContent compact />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleAccept}>
                            I Accept
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
