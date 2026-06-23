import UserManagementController from '@/actions/App/Http/Controllers/UserManagementController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function StatusDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const isDeactivate = user.is_active;

    const handleConfirm = useCallback(() => {
        setProcessing(true);

        const action = isDeactivate
            ? UserManagementController.deactivate(user.id)
            : UserManagementController.activate(user.id);

        router.patch(
            action.url,
            {},
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    toast.success(
                        isDeactivate ? 'User deactivated' : 'User activated',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                    setOpen(false);
                },
            },
        );
    }, [user.id, isDeactivate]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant={user.is_active ? 'outline' : 'default'}
                >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isDeactivate ? 'Deactivate User' : 'Activate User'}
                    </DialogTitle>
                    <DialogDescription>
                        {isDeactivate
                            ? `Disable ${user.name}'s account?`
                            : `Enable ${user.name}'s account?`}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant={isDeactivate ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
