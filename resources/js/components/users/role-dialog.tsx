import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PencilLine, Loader2, UserCog } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Props {
    user: any;
    roles: { id: number; name: string }[];
    onUpdateRole: (userId: number, role: string) => void;
}

export default function RoleDialog({ user, roles, onUpdateRole }: Props) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(user.role ?? '');
    const [processing, setProcessing] = useState(false);

    // Check if the user has actually selected a different role
    const hasChanges = value !== (user.role ?? '');

    const handleOpen = (next: boolean) => {
        setOpen(next);
        // Reset to original user role when opening/closing
        if (next) setValue(user.role ?? '');
    };

    const handleSave = useCallback(async () => {
        if (!value || !hasChanges) return;

        setProcessing(true);
        // Assuming onUpdateRole might be an async operation in the future, 
        // you can await it here if you update the prop signature.
        await onUpdateRole(user.id, value);
        
        setProcessing(false);
        setOpen(false);
    }, [user.id, value, hasChanges, onUpdateRole]);

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className={`gap-2 ${!user.role ? 'text-muted-foreground border-dashed' : ''}`}
                >
                    <PencilLine className="size-4" />
                    <span className="capitalize">{user.role ?? 'Assign role'}</span>
                </Button>
            </DialogTrigger>

           <DialogContent className="w-[90vw] sm:w-[50vw] lg:w-[25vw] max-w-none">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="size-5 text-muted-foreground" />
                        Change User Role
                    </DialogTitle>
                    <DialogDescription>
                        Update the role and access permissions for{' '}
                        <strong className="font-medium text-foreground">
                            {user.name || 'this user'}
                        </strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-select" className="text-right text-muted-foreground">
                            Role
                        </Label>
                        <div className="col-span-3">
                            <Select value={value} onValueChange={setValue} disabled={processing}>
                                <SelectTrigger id="role-select" className="w-full capitalize">
                                    <SelectValue placeholder="Select a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem 
                                            key={role.id} 
                                            value={role.name}
                                            className="capitalize"
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={() => setOpen(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={processing || !hasChanges}
                        className="min-w-[120px]"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}