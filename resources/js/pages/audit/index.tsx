import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { show as auditShow, index as auditsIndex } from '@/routes/audits';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ColumnDef,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    Clock4,
    History,
    LogIn,
    LogOut,
    UserRound,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

type ActivityRecord = {
    id: number;
    log_name: string | null;
    event?: string | null;
    description: string;
    properties: Record<string, unknown> | null;
    created_at: string;
    causer_id: number | null;
    causer_type: string | null;
    causer?: {
        id: number;
        name: string;
        email?: string | null;
    } | null;
    subject_type: string | null;
    subject_id: number | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedActivities = {
    data: ActivityRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

type Filters = {
    search?: string;
    type?: ActivityType;
};

type ActivityType =
    | 'all'
    | 'login'
    | 'logout'
    | 'authentication'
    | 'user-management'
    | 'role-management';

export default function AuditIndex({
    activities,
    filters,
}: {
    activities: PaginatedActivities;
    filters?: Filters;
}) {
    const [selected, setSelected] = useState<ActivityRecord | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [selectedType, setSelectedType] = useState<ActivityType>(
        (filters?.type as ActivityType) ?? 'all',
    );

    const data = useMemo(() => activities.data ?? [], [activities]);
    const summary = useMemo(() => {
        const loginCount = data.filter((record) => record.event === 'login' || /logged in/i.test(record.description)).length;
        const logoutCount = data.filter((record) => record.event === 'logout' || /logged out/i.test(record.description)).length;

        return {
            total: activities.total,
            loginCount,
            logoutCount,
        };
    }, [activities.total, data]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Audit Logs',
            href: auditsIndex().url,
        },
    ];

    const columnHelper = createColumnHelper<ActivityRecord>();

    const columns = [
        columnHelper.accessor('description', {
            header: ({ column }) => (
                <button
                    type="button"
                    className="flex items-center gap-2 hover:text-foreground"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Activity
                    <ArrowUpDown className="size-4" />
                </button>
            ),
            cell: (info) => (
                <div className="min-w-72 space-y-1">
                    <p className="font-medium text-foreground">
                        {toReadableActivityTitle(info.row.original)}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {toReadableActivityDetails(info.row.original)}
                    </p>
                </div>
            ),
        }),
        columnHelper.accessor('log_name', {
            header: 'Type',
            cell: (info) => {
                const variant = getBadgeVariant(info.row.original);

                return (
                    <Badge variant="outline" className={variant.className}>
                        {variant.icon}
                        {variant.label}
                    </Badge>
                );
            },
        }),
        columnHelper.accessor((row) => row.causer?.name ?? '—', {
            id: 'causer',
            header: 'User',
            cell: (info) => (
                <span className="text-sm text-muted-foreground">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <button
                    type="button"
                    className="flex items-center gap-2 hover:text-foreground"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Date & Time
                    <ArrowUpDown className="size-4" />
                </button>
            ),
            cell: (info) => (
                <div className="text-sm text-muted-foreground">
                    {formatDateTime(info.getValue())}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <div className="flex items-center justify-end gap-2">
                    <Dialog
                        open={selected?.id === info.row.original.id}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelected(null);
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelected(info.row.original)}>
                                Quick View
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Audit Record #{info.row.original.id}</DialogTitle>
                                <DialogDescription>{toReadableActivityTitle(info.row.original)}</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="gap-3 py-4">
                                    <CardHeader className="px-4">
                                        <CardTitle className="text-base">What happened</CardTitle>
                                        <CardDescription>{toReadableActivityDetails(info.row.original)}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 px-4 text-sm">
                                        <p>
                                            <span className="font-medium text-foreground">When: </span>
                                            <span className="text-muted-foreground">{formatDateTime(info.row.original.created_at)}</span>
                                        </p>
                                        <p>
                                            <span className="font-medium text-foreground">User: </span>
                                            <span className="text-muted-foreground">{info.row.original.causer?.name ?? 'System'}</span>
                                        </p>
                                        <p>
                                            <span className="font-medium text-foreground">Category: </span>
                                            <span className="text-muted-foreground">{getBadgeVariant(info.row.original).label}</span>
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="gap-3 py-4">
                                    <CardHeader className="px-4">
                                        <CardTitle className="text-base">Important details</CardTitle>
                                        <CardDescription>Presented in simple language for quick review.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 px-4 text-sm">
                                        {toReadablePropertyItems(info.row.original.properties).map((item) => (
                                            <p key={item.label}>
                                                <span className="font-medium text-foreground">{item.label}: </span>
                                                <span className="text-muted-foreground">{item.value}</span>
                                            </p>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="gap-3 py-4">
                                <CardHeader className="px-4">
                                    <CardTitle className="text-base">Technical JSON</CardTitle>
                                    <CardDescription>
                                        Raw data for technical troubleshooting.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 px-4 lg:grid-cols-2">
                                    <div>
                                        <h4 className="text-sm font-medium">Properties JSON</h4>
                                        <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-5">
                                            {JSON.stringify(info.row.original.properties ?? {}, null, 2)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium">Full JSON</h4>
                                        <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-5">
                                            {JSON.stringify(info.row.original, null, 2)}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <DialogClose asChild>
                                    <Button>Close</Button>
                                </DialogClose>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Link
                        href={auditShow(info.row.original.id).url}
                        className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
                    >
                        Open Page
                    </Link>
                </div>
            ),
        }),
    ] as ColumnDef<ActivityRecord, any>[];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        onSortingChange: setSorting,
    });

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            auditsIndex().url,
            {
                search: search || undefined,
                type: selectedType === 'all' ? undefined : selectedType,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Audit Logs</h1>
                        <p className="text-sm text-muted-foreground">Track user and system activities including login and logout events.</p>
                    </div>

                    <form
    onSubmit={submitFilters}
    method="get"
    action={auditsIndex().url}
    className="flex flex-col gap-2 sm:flex-row sm:items-end"
>
    {/* Search */}
    <div className="grid gap-1">
        <span className="text-sm text-muted-foreground">Search</span>
        <Input
            name="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activity, user, or category"
            className="sm:w-64"
        />
    </div>

    {/* Dropdown */}
    <div className="grid gap-1">
        <span className="text-sm text-muted-foreground">Type</span>
        <Select
            value={selectedType}
            onValueChange={(value) =>
                setSelectedType(value as ActivityType)
            }
        >
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent>
                {activityTypeOptions.map((typeOption) => (
                    <SelectItem
                        key={typeOption.value}
                        value={typeOption.value}
                    >
                        {typeOption.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>

    {/* Apply button */}
    <Button type="submit" className="mt-1">
        Apply
    </Button>
</form>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Total Records</CardDescription>
                            <CardTitle className="text-2xl">{summary.total}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <History className="size-4" />
                                Activity entries on current result set
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Login Events</CardDescription>
                            <CardTitle className="text-2xl">{summary.loginCount}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <LogIn className="size-4" />
                                Successful sign-in actions
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Logout Events</CardDescription>
                            <CardTitle className="text-2xl">{summary.logoutCount}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <LogOut className="size-4" />
                                Sign-out actions
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-xs font-semibold">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column
                                                        .columnDef.header,
                                                    header.getContext(),
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="align-top whitespace-normal">
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
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No activity logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {activities.from ?? 0} to {activities.to ?? 0} of {activities.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {activities.links.map((link, index) =>
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
            </div>
        </AppLayout>
    );
}

const activityTypeOptions: Array<{ value: ActivityType; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'authentication', label: 'Authentication' },
    { value: 'user-management', label: 'User Management' },
    { value: 'role-management', label: 'Role Management' },
];

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function toReadableActivityTitle(activity: ActivityRecord): string {
    if (/logged in/i.test(activity.description)) {
        return 'User signed in';
    }

    if (/logged out/i.test(activity.description)) {
        return 'User signed out';
    }

    if (/changed user role/i.test(activity.description)) {
        return 'User role was updated';
    }

    if (/activated user/i.test(activity.description)) {
        return 'User account was activated';
    }

    if (/deactivated user/i.test(activity.description)) {
        return 'User account was deactivated';
    }

    return activity.description;
}

function toReadableActivityDetails(activity: ActivityRecord): string {
    const actor = activity.causer?.name ?? 'System';

    if (/logged in/i.test(activity.description)) {
        return `${actor} signed in to the system.`;
    }

    if (/logged out/i.test(activity.description)) {
        return `${actor} signed out of the system.`;
    }

    if (/changed user role/i.test(activity.description)) {
        const oldRole = extractProperty(activity.properties, 'old_roles.0');
        const newRole = extractProperty(activity.properties, 'new_roles.0');

        if (oldRole || newRole) {
            return `${actor} changed a role from ${oldRole ?? 'none'} to ${newRole ?? 'none'}.`;
        }

        return `${actor} changed a user's role.`;
    }

    return `${actor} performed: ${activity.description}.`;
}

function toReadablePropertyItems(properties: ActivityRecord['properties']): Array<{ label: string; value: string }> {
    if (!properties || typeof properties !== 'object') {
        return [{ label: 'Details', value: 'No extra details available.' }];
    }

    const entries = Object.entries(properties);

    if (entries.length === 0) {
        return [{ label: 'Details', value: 'No extra details available.' }];
    }

    return entries.slice(0, 8).map(([key, value]) => ({
        label: toHeadline(key.replaceAll('_', ' ')),
        value: toReadableValue(value),
    }));
}

function toReadableValue(value: unknown): string {
    if (value === null || value === undefined) {
        return 'None';
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'None';
        }

        return value.map((item) => String(item)).join(', ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

function toHeadline(value: string): string {
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function extractProperty(properties: ActivityRecord['properties'], path: string): string | null {
    if (!properties || typeof properties !== 'object') {
        return null;
    }

    const parts = path.split('.');
    let cursor: unknown = properties;

    for (const part of parts) {
        if (
            cursor === null ||
            typeof cursor !== 'object' ||
            !(part in (cursor as Record<string, unknown>))
        ) {
            return null;
        }

        cursor = (cursor as Record<string, unknown>)[part];
    }

    return cursor === null || cursor === undefined ? null : String(cursor);
}

function getBadgeVariant(activity: ActivityRecord): { label: string; className: string; icon: ReactNode } {
    if (/logged in/i.test(activity.description)) {
        return {
            label: 'Login',
            className: 'border-emerald-300 text-emerald-700 dark:text-emerald-300',
            icon: <LogIn className="size-3.5" />,
        };
    }

    if (/logged out/i.test(activity.description)) {
        return {
            label: 'Logout',
            className: 'border-slate-300 text-slate-700 dark:text-slate-300',
            icon: <LogOut className="size-3.5" />,
        };
    }

    if ((activity.log_name ?? '').includes('user')) {
        return {
            label: 'User Management',
            className: 'border-blue-300 text-blue-700 dark:text-blue-300',
            icon: <UserRound className="size-3.5" />,
        };
    }

    if ((activity.log_name ?? '').includes('role')) {
        return {
            label: 'Role Management',
            className: 'border-amber-300 text-amber-700 dark:text-amber-300',
            icon: <History className="size-3.5" />,
        };
    }

    return {
        label: toHeadline((activity.log_name ?? 'General').replaceAll('-', ' ')),
        className: 'border-muted-foreground/20 text-muted-foreground',
        icon: <Clock4 className="size-3.5" />,
    };
}
