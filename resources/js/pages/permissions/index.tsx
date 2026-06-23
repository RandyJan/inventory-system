import PermissionManagementController from '@/actions/App/Http/Controllers/PermissionManagementController';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import { index as permissionsIndex } from '@/routes/permissions';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    KeyRound,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEvent, type ReactNode, useMemo, useState } from 'react';

type ManagedPermission = {
    id: number;
    name: string;
    guard_name: string;
    module: string;
    roles_count: number;
    users_count: number;
    created_at: string | null;
    updated_at: string | null;
};

type PermissionFormData = {
    name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permission Management',
        href: permissionsIndex().url,
    },
];

export default function PermissionsIndex({
    permissions,
}: {
    permissions: ManagedPermission[];
}) {
    const { auth } = usePage<SharedData>().props;
    const grantedPermissions = new Set(auth.permissions ?? []);
    const canCreate = grantedPermissions.has('permissions.create');
    const canUpdate = grantedPermissions.has('permissions.update');
    const canDelete = grantedPermissions.has('permissions.delete');
    const summary = useMemo(() => {
        const modules = new Set(
            permissions.map((permission) => permission.module),
        );

        return {
            permissions: permissions.length,
            modules: modules.size,
            assignedRoles: permissions.reduce(
                (total, permission) => total + permission.roles_count,
                0,
            ),
            directUsers: permissions.reduce(
                (total, permission) => total + permission.users_count,
                0,
            ),
        };
    }, [permissions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permission Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Permission Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create permissions, review module coverage, and
                            remove unused access flags.
                        </p>
                    </div>

                    {canCreate && <PermissionFormDialog />}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Permissions"
                        value={summary.permissions}
                        icon={<KeyRound className="size-4" />}
                    />
                    <SummaryCard
                        title="Modules"
                        value={summary.modules}
                        icon={<ShieldCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="Role links"
                        value={summary.assignedRoles}
                        icon={<ShieldCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="Direct users"
                        value={summary.directUsers}
                        icon={<Users className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>
                            Permission names should follow the module.action
                            pattern.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Permission</TableHead>
                                        <TableHead>Module</TableHead>
                                        <TableHead className="text-right">
                                            Roles
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Users
                                        </TableHead>
                                        <TableHead>Updated</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {permissions.map((permission) => (
                                        <TableRow key={permission.id}>
                                            <TableCell className="min-w-56 font-medium break-all">
                                                {permission.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {permission.module}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {permission.roles_count}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {permission.users_count}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(
                                                    permission.updated_at,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    {canUpdate && (
                                                        <PermissionFormDialog
                                                            permission={
                                                                permission
                                                            }
                                                        />
                                                    )}
                                                    {canDelete && (
                                                        <DeletePermissionButton
                                                            permission={
                                                                permission
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {permissions.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                No permissions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function PermissionFormDialog({
    permission,
}: {
    permission?: ManagedPermission;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<PermissionFormData>({
        name: permission?.name ?? '',
    });

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData({ name: permission?.name ?? '' });
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

        if (permission) {
            form.put(
                PermissionManagementController.update(permission.id).url,
                options,
            );

            return;
        }

        form.post(PermissionManagementController.store().url, options);
    }

    return (
        <Dialog open={open} onOpenChange={openDialog}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant={permission ? 'outline' : 'default'}
                    size={permission ? 'sm' : 'default'}
                >
                    {permission ? <Pencil /> : <Plus />}
                    {permission ? 'Edit' : 'New permission'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {permission ? 'Edit permission' : 'New permission'}
                    </DialogTitle>
                    <DialogDescription>
                        Use names such as items.view or reports.export.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label
                            htmlFor={
                                permission
                                    ? `permission-${permission.id}`
                                    : 'permission-new'
                            }
                        >
                            Name
                        </Label>
                        <Input
                            id={
                                permission
                                    ? `permission-${permission.id}`
                                    : 'permission-new'
                            }
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="module.action"
                            autoFocus
                        />
                        <InputError message={form.errors.name} />
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

function DeletePermissionButton({
    permission,
}: {
    permission: ManagedPermission;
}) {
    const [processing, setProcessing] = useState(false);
    const isAssigned = permission.roles_count > 0 || permission.users_count > 0;

    function deletePermission() {
        setProcessing(true);

        router.delete(
            PermissionManagementController.destroy(permission.id).url,
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isAssigned || processing}
                >
                    <Trash2 />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete permission</AlertDialogTitle>
                    <AlertDialogDescription>
                        This removes {permission.name} from permission
                        management.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={deletePermission}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SummaryCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: number | string;
    icon: ReactNode;
}) {
    return (
        <Card className="gap-2 py-4">
            <CardHeader className="px-4 pb-0">
                <CardDescription className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
        </Card>
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
