import UserManagementController from '@/actions/App/Http/Controllers/UserManagementController';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import RoleDialog from '@/components/users/role-dialog';
import StatusDialog from '@/components/users/status-dialog';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as usersIndex } from '@/routes/users';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, CheckCircle2, Search, XCircle } from 'lucide-react';
import { FormEvent, memo, useCallback, useMemo, useState } from 'react';

type RoleOption = {
    id: number;
    name: string;
};

type ManagedUser = {
    id: number;
    name: string;
    email: string | null;
    username: string | null;
    is_active: boolean;
    is_current_user: boolean;
    role: string | null;
    roles: string[];
    updated_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: ManagedUser[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Filters = {
    search?: string;
    status?: 'active' | 'inactive';
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: usersIndex().url,
    },
];

// Column definitions with proper typing
const createColumns = (
    roles: RoleOption[],
    onUpdateRole: (userId: number, roleName: string | null) => void,
): ColumnDef<ManagedUser>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <button
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                User
                <ArrowUpDown className="size-4" />
            </button>
        ),
        cell: ({ row }) => (
            <div className="min-w-56">
                <div className="font-medium">{row.original.name}</div>
                <div className="text-sm text-muted-foreground">
                    {row.original.email ?? 'No email'}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'username',
        header: ({ column }) => (
            <button
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Username
                <ArrowUpDown className="size-4" />
            </button>
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.username ?? 'Not set'}
            </span>
        ),
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <button
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Role
                <ArrowUpDown className="size-4" />
            </button>
        ),
        cell: ({ row }) => (
            <RoleDialog
                user={row.original}
                roles={roles}
                onUpdateRole={onUpdateRole}
            />
        ),
    },
    {
        accessorKey: 'is_active',
        header: ({ column }) => (
            <button
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Status
                <ArrowUpDown className="size-4" />
            </button>
        ),
        cell: ({ row }) => (
            <Badge
                variant={row.original.is_active ? 'default' : 'secondary'}
                className={cn(
                    row.original.is_active
                        ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                        : 'text-muted-foreground',
                )}
            >
                {row.original.is_active ? <CheckCircle2 /> : <XCircle />}
                {row.original.is_active ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        accessorKey: 'updated_at',
        header: ({ column }) => (
            <button
                className="flex items-center gap-2 hover:text-foreground"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Updated
                <ArrowUpDown className="size-4" />
            </button>
        ),
        cell: ({ row }) => <span>{formatDate(row.original.updated_at)}</span>,
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
            <div className="text-right">
                {row.original.is_current_user ? (
                    <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="cursor-not-allowed opacity-60"
                        title="You cannot deactivate your own account"
                    >
                        Protected
                    </Button>
                ) : (
                    <StatusDialog user={row.original} />
                )}
            </div>
        ),
    },
];

// Memoized table header component
const UsersTableHeader = memo(
    ({ table }: { table: ReturnType<typeof useReactTable<ManagedUser>> }) => (
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                        <TableHead
                            key={header.id}
                            className="text-xs font-semibold"
                        >
                            {header.isPlaceholder
                                ? null
                                : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                  )}
                        </TableHead>
                    ))}
                </TableRow>
            ))}
        </TableHeader>
    ),
);
UsersTableHeader.displayName = 'UsersTableHeader';

// Memoized table body component
const UsersTableBody = memo(
    ({ table }: { table: ReturnType<typeof useReactTable<ManagedUser>> }) => (
        <TableBody>
            {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                    >
                        No users found.
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    ),
);
UsersTableBody.displayName = 'UsersTableBody';

// Memoized pagination component
const UsersPagination = memo(
    ({ paginatedUsers }: { paginatedUsers: PaginatedUsers }) => {
        if (paginatedUsers.links.length <= 3) {
            return null;
        }

        return (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {paginatedUsers.from ?? 0} to{' '}
                    {paginatedUsers.to ?? 0} of {paginatedUsers.total}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    {paginatedUsers.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url}
                                preserveScroll
                                className={cn(
                                    buttonVariants({
                                        variant: link.active
                                            ? 'default'
                                            : 'outline',
                                        size: 'sm',
                                    }),
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={`${link.label}-${index}`}
                                className={cn(
                                    buttonVariants({
                                        variant: 'outline',
                                        size: 'sm',
                                    }),
                                    'pointer-events-none opacity-50',
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>
            </div>
        );
    },
);
UsersPagination.displayName = 'UsersPagination';

// Main component
export default function UsersIndex({
    users,
    roles,
    filters,
}: {
    users: PaginatedUsers;
    roles: RoleOption[];
    filters: Filters;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [sorting, setSorting] = useState<SortingState>([]);

    // Server-side filter submission
    const submitFilters = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            router.get(
                usersIndex().url,
                {
                    search: search || undefined,
                    status: status === 'all' ? undefined : status,
                },
                {
                    preserveScroll: true,
                    preserveState: false,
                    replace: true,
                },
            );
        },
        [search, status],
    );

    // Client-side callbacks for role and status updates
    const handleUpdateRole = useCallback(
        (userId: number, roleName: string | null) => {
            router.patch(
                UserManagementController.updateRole(userId).url,
                { role: roleName },
                {
                    preserveScroll: true,
                    preserveState: false,
                },
            );
        },
        [],
    );

    const handleToggleStatus = useCallback(
        (userId: number, isActive: boolean) => {
            const action = isActive
                ? UserManagementController.deactivate(userId)
                : UserManagementController.activate(userId);

            router.patch(
                action.url,
                {},
                {
                    preserveScroll: true,
                },
            );
        },
        [],
    );

    // Create columns with memoization
    const columns = useMemo(
        () => createColumns(roles, handleUpdateRole),
        [roles, handleUpdateRole],
    );

    // Table instance
    const table = useReactTable({
        data: users.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        enableRowSelection: false,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Header Section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            User Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {users.total} users
                        </p>
                    </div>

                    <form
                        onSubmit={submitFilters}
                        className="flex flex-col gap-2 sm:flex-row sm:items-end"
                    >
                        <div className="grid gap-1">
                            <Label htmlFor="user-search">Search</Label>
                            <Input
                                id="user-search"
                                name="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="sm:w-64"
                                placeholder="Name, email, username"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={(value) =>
                                    setStatus(
                                        value as 'all' | 'active' | 'inactive',
                                    )
                                }
                            >
                                <SelectTrigger className="w-full sm:w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit">
                            <Search />
                            Search
                        </Button>
                    </form>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <UsersTableHeader table={table} />
                        <UsersTableBody table={table} />
                    </Table>
                </div>

                {/* Pagination Section */}
                <UsersPagination paginatedUsers={users} />
            </div>
        </AppLayout>
    );
}

// Role selection component
interface RoleSelectProps {
    user: ManagedUser;
    roles: RoleOption[];
    onUpdateRole: (userId: number, roleName: string | null) => void;
}

// Status button component
interface StatusButtonProps {
    user: ManagedUser;
    onToggleStatus: (userId: number, isActive: boolean) => void;
}

// Utility function
function formatDate(value: string | null) {
    if (!value) {
        return 'Not available';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
