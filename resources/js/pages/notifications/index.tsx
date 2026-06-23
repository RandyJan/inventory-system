import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';

import {
    Card,
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
import { index as notificationsIndex } from '@/routes/notifications';
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

import { ArrowUpDown } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type Notification = {
    id: string;
    type: string;
    old_role?: string | null;
    new_role?: string | null;
    changed_by?: string;
    read_at?: string | null;
    created_at: string;
};

export default function NotificationsPage({ notifications, filters }: any) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [selectedType, setSelectedType] = useState(filters?.type ?? 'all');
    const [selected, setSelected] = useState<Notification | null>(null);

    const data = useMemo(() => notifications.data ?? [], [notifications]);

    const summary = useMemo(() => {
        return {
            total: notifications.total,
            unread: data.filter((n) => !n.read_at).length,
            read: data.filter((n) => n.read_at).length,
        };
    }, [notifications.total, data]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Notifications', href: notificationsIndex().url },
    ];

    const columnHelper = createColumnHelper<Notification>();

    const columns = [
        columnHelper.accessor('type', {
            header: 'Notification',
            cell: (info) => {
                const n = info.row.original;

                return (
                    <div className="min-w-72 space-y-1">
                        <p className="font-medium">{getTitle(n)}</p>
                        <p className="text-sm text-muted-foreground">
                            {getDescription(n)}
                        </p>
                    </div>
                );
            },
        }),

        columnHelper.accessor('type', {
            header: 'Type',
            cell: (info) => (
                <Badge variant="outline">{formatType(info.getValue())}</Badge>
            ),
        }),

        columnHelper.accessor('created_at', {
            header: ({ column }) => (
                <button
                    className="flex items-center gap-2"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Date
                    <ArrowUpDown className="size-4" />
                </button>
            ),
            cell: (info) => (
                <span className="text-sm text-muted-foreground">
                    {formatDateTime(info.getValue())}
                </span>
            ),
        }),

        columnHelper.display({
            id: 'status',
            header: 'Status',
            cell: (info) =>
                info.row.original.read_at ? (
                    <Badge variant="secondary">Read</Badge>
                ) : (
                    <Badge className="bg-blue-600 text-white">New</Badge>
                ),
        }),

        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <Dialog
                    open={selected?.id === info.row.original.id}
                    onOpenChange={(open) => {
                        if (!open) setSelected(null);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(info.row.original)}
                        >
                            View
                        </Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Notification Details</DialogTitle>
                            <DialogDescription>
                                {getTitle(info.row.original)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2 text-sm">
                            <p>
                                <b>Details:</b>{' '}
                                {getDescription(info.row.original)}
                            </p>
                            <p>
                                <b>Type:</b>{' '}
                                {formatType(info.row.original.type)}
                            </p>
                            <p>
                                <b>Date:</b>{' '}
                                {formatDateTime(info.row.original.created_at)}
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <DialogClose asChild>
                                <Button>Close</Button>
                            </DialogClose>
                        </div>
                    </DialogContent>
                </Dialog>
            ),
        }),
    ] as ColumnDef<Notification, any>[];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
        onSortingChange: setSorting,
    });

    function submitFilters(e: FormEvent) {
        e.preventDefault();

        router.get(
            notificationsIndex().url,
            {
                search: search || undefined,
                type: selectedType === 'all' ? undefined : selectedType,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Notifications
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage system notifications
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    '/notifications/read-all',
                                    {},
                                    {
                                        preserveScroll: true,
                                    },
                                )
                            }
                        >
                            Mark all as read
                        </Button>

                        <form onSubmit={submitFilters} className="flex gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                            />

                            <Select
                                value={selectedType}
                                onValueChange={setSelectedType}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="role_changed">
                                        Role Changed
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit">Apply</Button>
                        </form>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardDescription>Total</CardDescription>
                            <CardTitle>{summary.total}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription>Unread</CardDescription>
                            <CardTitle>{summary.unread}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardDescription>Read</CardDescription>
                            <CardTitle>{summary.read}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((h) => (
                                        <TableHead key={h.id}>
                                            {flexRender(
                                                h.column.columnDef.header,
                                                h.getContext(),
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => {
                                        if (!row.original.read_at) {
                                            router.post(
                                                `/notifications/${row.original.id}/read`,
                                                {},
                                                {
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                    className={cn(
                                        'cursor-pointer',
                                        !row.original.read_at &&
                                            'bg-blue-50 dark:bg-blue-950/30',
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {notifications.from ?? 0} to{' '}
                        {notifications.to ?? 0} of {notifications.total}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {notifications.links.map((link: any, index: number) =>
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
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
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
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function getTitle(n: any) {
    if (n.type === 'role_changed') return 'Role Updated';
    return 'Notification';
}

function getDescription(n: any) {
    if (n.type === 'role_changed') {
        return `Changed from ${n.old_role ?? 'none'} to ${
            n.new_role ?? 'none'
        } by ${n.changed_by}`;
    }
    return 'System notification';
}

function formatType(type: string) {
    return type.replace('_', ' ');
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
