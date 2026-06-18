import RoleManagementController from '@/actions/App/Http/Controllers/RoleManagementController';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as rolesIndex } from '@/routes/roles';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

type PermissionOption = {
    id: number;
    name: string;
};

type ManagedRole = {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
    updated_at: string | null;
};

type RoleFormData = {
    name: string;
    permissions: string[];
    new_permissions: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Management',
        href: rolesIndex().url,
    },
];

export default function RolesIndex({
    roles,
    permissions,
}: {
    roles: ManagedRole[];
    permissions: PermissionOption[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Role Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {roles.length} roles
                        </p>
                    </div>

                    <RoleFormDialog permissions={permissions} />
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="min-w-48 font-medium">
                                        {role.name}
                                    </TableCell>
                                    <TableCell>
                                        <PermissionBadges
                                            permissions={role.permissions}
                                        />
                                    </TableCell>
                                    <TableCell>{role.users_count}</TableCell>
                                    <TableCell>
                                        {formatDate(role.updated_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <RoleFormDialog
                                                role={role}
                                                permissions={permissions}
                                            />
                                            <DeleteRoleButton role={role} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {roles.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}

function RoleFormDialog({
    role,
    permissions,
}: {
    role?: ManagedRole;
    permissions: PermissionOption[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<RoleFormData>({
        name: role?.name ?? '',
        permissions: role?.permissions ?? [],
        new_permissions: '',
    });

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData({
                name: role?.name ?? '',
                permissions: role?.permissions ?? [],
                new_permissions: '',
            });
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        };

        if (role) {
            form.put(RoleManagementController.update(role.id).url, options);

            return;
        }

        form.post(RoleManagementController.store().url, options);
    }

    function togglePermission(permissionName: string, checked: boolean) {
        form.setData(
            'permissions',
            checked
                ? [...form.data.permissions, permissionName]
                : form.data.permissions.filter(
                      (permission) => permission !== permissionName,
                  ),
        );
    }

    return (
        <Dialog open={open} onOpenChange={openDialog}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant={role ? 'outline' : 'default'}
                    size={role ? 'sm' : 'default'}
                >
                    {role ? <Pencil /> : <Plus />}
                    {role ? 'Edit' : 'New role'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{role ? 'Edit role' : 'New role'}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Role form
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor={role ? `role-${role.id}` : 'role-new'}>
                            Name
                        </Label>
                        <Input
                            id={role ? `role-${role.id}` : 'role-new'}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoFocus
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Permissions</Label>
                        <div className="grid max-h-72 gap-3 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                            {permissions.map((permission) => (
                                <label
                                    key={permission.id}
                                    className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60"
                                >
                                    <Checkbox
                                        checked={form.data.permissions.includes(
                                            permission.name,
                                        )}
                                        onCheckedChange={(checked) =>
                                            togglePermission(
                                                permission.name,
                                                checked === true,
                                            )
                                        }
                                    />
                                    <span className="min-w-0 text-sm break-all">
                                        {permission.name}
                                    </span>
                                </label>
                            ))}
                            {permissions.length === 0 && (
                                <div className="text-sm text-muted-foreground">
                                    No permissions found.
                                </div>
                            )}
                        </div>
                        <InputError message={form.errors.permissions} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={role ? `new-${role.id}` : 'new-role'}>
                            New permissions
                        </Label>
                        <Textarea
                            id={role ? `new-${role.id}` : 'new-role'}
                            value={form.data.new_permissions}
                            onChange={(event) =>
                                form.setData(
                                    'new_permissions',
                                    event.target.value,
                                )
                            }
                            placeholder="reports.view, reports.export"
                        />
                        <InputError message={form.errors.new_permissions} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PermissionBadges({ permissions }: { permissions: string[] }) {
    if (permissions.length === 0) {
        return <span className="text-muted-foreground">None</span>;
    }

    const visiblePermissions = permissions.slice(0, 6);
    const hiddenCount = permissions.length - visiblePermissions.length;

    return (
        <div className="flex max-w-xl flex-wrap gap-1.5">
            {visiblePermissions.map((permission) => (
                <Badge
                    key={permission}
                    variant="secondary"
                    className="break-all"
                >
                    {permission}
                </Badge>
            ))}
            {hiddenCount > 0 && <Badge variant="outline">+{hiddenCount}</Badge>}
        </div>
    );
}

function DeleteRoleButton({ role }: { role: ManagedRole }) {
    const [processing, setProcessing] = useState(false);
    const disabled = role.name === 'Administrator' || role.users_count > 0;

    function destroyRole() {
        setProcessing(true);

        router.delete(RoleManagementController.destroy(role.id).url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || processing}
                >
                    <Trash2 />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete role</AlertDialogTitle>
                    <AlertDialogDescription>
                        This removes {role.name} from role management.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={destroyRole}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function formatDate(value: string | null) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
