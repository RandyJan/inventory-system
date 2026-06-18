import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    approve,
    index as stockTransfersIndex,
    reject,
    store,
} from '@/routes/stock-transfers';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Plus,
    Repeat,
    Search,
    Trash2,
    Warehouse,
    XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Option = {
    id: number;
    label: string;
};

type LocationOption = Option & {
    warehouse_id: number;
};

type ItemOption = Option & {
    warehouse_id: number | null;
    unit_of_measure: string;
    quantity_on_hand: number;
};

type TransferLine = {
    id: number;
    item: string;
    quantity_transferred: number;
    unit_of_measure: string;
};

type Transfer = {
    id: number;
    transfer_number: string;
    source_warehouse: Option;
    destination_warehouse: Option;
    destination_location: Option | null;
    requested_by?: string | null;
    approved_by?: string | null;
    requested_date: string;
    approved_date?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    total_quantity_transferred: number;
    remarks?: string | null;
    approval_remarks?: string | null;
    lines: TransferLine[];
};

type PaginatedTransfers = {
    data: Transfer[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type TransferFormData = {
    transfer_number: string;
    source_warehouse_id: string;
    destination_warehouse_id: string;
    destination_location_id: string;
    requested_date: string;
    remarks: string;
    lines: {
        item_id: string;
        quantity_transferred: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock Transfers', href: stockTransfersIndex().url },
];

export default function StockTransfersIndex({
    transfers,
    summary,
    warehouses,
    locations,
    items,
    statuses,
    filters,
}: {
    transfers: PaginatedTransfers;
    summary: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    warehouses: Option[];
    locations: LocationOption[];
    items: ItemOption[];
    statuses: string[];
    filters: {
        search?: string;
        status?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('stock-transfers.create');
    const canApprove = permissions.has('stock-transfers.approve');
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            stockTransfersIndex().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function approveTransfer(transfer: Transfer) {
        const approvalRemarks =
            window.prompt('Approval remarks (optional)') ?? '';

        router.post(
            approve(transfer.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    function rejectTransfer(transfer: Transfer) {
        const approvalRemarks = window.prompt('Reason for rejection');

        if (!approvalRemarks) {
            return;
        }

        router.post(
            reject(transfer.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfers" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Transfers
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Move inventory through request, approval, and
                            destination warehouse assignment.
                        </p>
                    </div>
                    {canCreate && (
                        <TransferDialog
                            warehouses={warehouses}
                            locations={locations}
                            items={items}
                        />
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Transfer Requests"
                        value={summary.total}
                        icon={<Repeat className="size-4" />}
                    />
                    <SummaryCard
                        title="Pending Approval"
                        value={summary.pending}
                        icon={<Clock3 className="size-4" />}
                    />
                    <SummaryCard
                        title="Approved"
                        value={summary.approved}
                        icon={<CheckCircle2 className="size-4" />}
                    />
                    <SummaryCard
                        title="Rejected"
                        value={summary.rejected}
                        icon={<XCircle className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Transfers</CardTitle>
                        <CardDescription>
                            Search by transfer number, warehouse, or item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="transfer-search">Search</Label>
                                <Input
                                    id="transfer-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Transfer number, item, warehouse"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All statuses
                                        </SelectItem>
                                        {statuses.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {titleCase(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="md:self-end">
                                <Search className="size-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Transfer History</CardTitle>
                        <CardDescription>
                            Source Warehouse to Transfer Request to Approval to
                            Destination Warehouse.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transfer</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead>Items</TableHead>
                                        {canApprove && (
                                            <TableHead className="text-right">
                                                Approval
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.data.map((transfer) => (
                                        <TableRow key={transfer.id}>
                                            <TableCell>
                                                <div className="min-w-48 space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            transfer.transfer_number
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Requested{' '}
                                                        {
                                                            transfer.requested_date
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By{' '}
                                                        {transfer.requested_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-64 space-y-1 text-sm">
                                                    <p>
                                                        {
                                                            transfer
                                                                .source_warehouse
                                                                .label
                                                        }
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        to{' '}
                                                        {
                                                            transfer
                                                                .destination_warehouse
                                                                .label
                                                        }
                                                    </p>
                                                    {transfer.destination_location && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Location:{' '}
                                                            {
                                                                transfer
                                                                    .destination_location
                                                                    .label
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={transfer.status}
                                                />
                                                {transfer.approved_by && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {transfer.approved_by}{' '}
                                                        on{' '}
                                                        {
                                                            transfer.approved_date
                                                        }
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {
                                                    transfer.total_quantity_transferred
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                                                    {transfer.lines.map(
                                                        (line) => (
                                                            <div
                                                                key={line.id}
                                                                className="rounded-md border p-2 text-sm"
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <span className="font-medium">
                                                                        {
                                                                            line.item
                                                                        }
                                                                    </span>
                                                                    <Badge variant="secondary">
                                                                        {
                                                                            line.quantity_transferred
                                                                        }{' '}
                                                                        {
                                                                            line.unit_of_measure
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                            {canApprove && (
                                                <TableCell className="text-right">
                                                    {transfer.status ===
                                                    'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    approveTransfer(
                                                                        transfer,
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle2 className="size-4" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    rejectTransfer(
                                                                        transfer,
                                                                    )
                                                                }
                                                            >
                                                                <XCircle className="size-4" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            Closed
                                                        </span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                    {transfers.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={canApprove ? 6 : 5}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No transfer requests found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {transfers.from ?? 0} to {transfers.to ?? 0} of{' '}
                        {transfers.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {transfers.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={cn(
                                        'inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm',
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-background hover:bg-muted',
                                    )}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm opacity-50"
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

function TransferDialog({
    warehouses,
    locations,
    items,
}: {
    warehouses: Option[];
    locations: LocationOption[];
    items: ItemOption[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<TransferFormData>(transferDefaults());
    const sourceWarehouseId = Number(form.data.source_warehouse_id || 0);
    const destinationWarehouseId = Number(
        form.data.destination_warehouse_id || 0,
    );
    const sourceItems = sourceWarehouseId
        ? items.filter((item) => item.warehouse_id === sourceWarehouseId)
        : items;
    const destinationLocations = destinationWarehouseId
        ? locations.filter(
              (location) => location.warehouse_id === destinationWarehouseId,
          )
        : [];

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(transferDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [
            ...form.data.lines,
            { item_id: '', quantity_transferred: '1' },
        ]);
    }

    function removeLine(index: number) {
        if (form.data.lines.length === 1) {
            return;
        }

        form.setData(
            'lines',
            form.data.lines.filter((_, lineIndex) => lineIndex !== index),
        );
    }

    function updateLine(
        index: number,
        field: keyof TransferFormData['lines'][number],
        value: string,
    ) {
        form.setData(
            'lines',
            form.data.lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={openDialog}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="size-4" />
                    Request Transfer
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Transfer Request</DialogTitle>
                    <DialogDescription>
                        Select a source warehouse, destination warehouse, and
                        items for approval.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            id="transfer_number"
                            label="Transfer Number"
                            error={form.errors.transfer_number}
                        >
                            <Input
                                id="transfer_number"
                                value={form.data.transfer_number}
                                onChange={(event) =>
                                    form.setData(
                                        'transfer_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="requested_date"
                            label="Requested Date"
                            error={form.errors.requested_date}
                            required
                        >
                            <Input
                                id="requested_date"
                                type="date"
                                value={form.data.requested_date}
                                onChange={(event) =>
                                    form.setData(
                                        'requested_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            id="destination_location_id"
                            label="Destination Location"
                            error={form.errors.destination_location_id}
                        >
                            <Select
                                value={
                                    form.data.destination_location_id || 'none'
                                }
                                onValueChange={(value) =>
                                    form.setData(
                                        'destination_location_id',
                                        value === 'none' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger id="destination_location_id">
                                    <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No specific location
                                    </SelectItem>
                                    {destinationLocations.map((location) => (
                                        <SelectItem
                                            key={location.id}
                                            value={String(location.id)}
                                        >
                                            {location.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="source_warehouse_id"
                            label="Source Warehouse"
                            error={form.errors.source_warehouse_id}
                            required
                        >
                            <Select
                                value={form.data.source_warehouse_id}
                                onValueChange={(value) => {
                                    form.setData({
                                        ...form.data,
                                        source_warehouse_id: value,
                                        lines: [
                                            {
                                                item_id: '',
                                                quantity_transferred: '1',
                                            },
                                        ],
                                    });
                                }}
                            >
                                <SelectTrigger id="source_warehouse_id">
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem
                                            key={warehouse.id}
                                            value={String(warehouse.id)}
                                        >
                                            {warehouse.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field
                            id="destination_warehouse_id"
                            label="Destination Warehouse"
                            error={form.errors.destination_warehouse_id}
                            required
                        >
                            <Select
                                value={form.data.destination_warehouse_id}
                                onValueChange={(value) => {
                                    form.setData({
                                        ...form.data,
                                        destination_warehouse_id: value,
                                        destination_location_id: '',
                                    });
                                }}
                            >
                                <SelectTrigger id="destination_warehouse_id">
                                    <SelectValue placeholder="Select destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem
                                            key={warehouse.id}
                                            value={String(warehouse.id)}
                                        >
                                            {warehouse.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <Field
                        id="remarks"
                        label="Remarks"
                        error={form.errors.remarks}
                    >
                        <Textarea
                            id="remarks"
                            value={form.data.remarks}
                            onChange={(event) =>
                                form.setData('remarks', event.target.value)
                            }
                            rows={3}
                        />
                    </Field>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-medium">
                                    Transfer Items
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Items are filtered by the selected source
                                    warehouse.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addLine}
                            >
                                <Plus className="size-4" />
                                Add Item
                            </Button>
                        </div>

                        <InputError message={form.errors.lines} />

                        <div className="space-y-3">
                            {form.data.lines.map((line, index) => {
                                const selectedItem = items.find(
                                    (item) => String(item.id) === line.item_id,
                                );

                                return (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_180px_auto]"
                                    >
                                        <Field
                                            id={`lines-${index}-item`}
                                            label="Item"
                                            error={
                                                form.errors[
                                                    `lines.${index}.item_id` as keyof typeof form.errors
                                                ]
                                            }
                                            required
                                        >
                                            <Select
                                                value={line.item_id}
                                                onValueChange={(value) =>
                                                    updateLine(
                                                        index,
                                                        'item_id',
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id={`lines-${index}-item`}
                                                >
                                                    <SelectValue placeholder="Select item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sourceItems.map((item) => (
                                                        <SelectItem
                                                            key={item.id}
                                                            value={String(
                                                                item.id,
                                                            )}
                                                        >
                                                            {item.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {selectedItem && (
                                                <p className="text-xs text-muted-foreground">
                                                    Available:{' '}
                                                    {
                                                        selectedItem.quantity_on_hand
                                                    }{' '}
                                                    {
                                                        selectedItem.unit_of_measure
                                                    }
                                                </p>
                                            )}
                                        </Field>
                                        <Field
                                            id={`lines-${index}-quantity`}
                                            label="Quantity"
                                            error={
                                                form.errors[
                                                    `lines.${index}.quantity_transferred` as keyof typeof form.errors
                                                ]
                                            }
                                            required
                                        >
                                            <Input
                                                id={`lines-${index}-quantity`}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                max={
                                                    selectedItem
                                                        ? selectedItem.quantity_on_hand
                                                        : undefined
                                                }
                                                value={
                                                    line.quantity_transferred
                                                }
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'quantity_transferred',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </Field>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    form.data.lines.length === 1
                                                }
                                                onClick={() =>
                                                    removeLine(index)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                                <span className="sr-only">
                                                    Remove line
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
                            Submit for Approval
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function transferDefaults(): TransferFormData {
    return {
        transfer_number: '',
        source_warehouse_id: '',
        destination_warehouse_id: '',
        destination_location_id: '',
        requested_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        lines: [{ item_id: '', quantity_transferred: '1' }],
    };
}

function StatusBadge({ status }: { status: Transfer['status'] }) {
    const className =
        status === 'approved'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
            : status === 'rejected'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300';

    return (
        <Badge variant="outline" className={cn('capitalize', className)}>
            {status}
        </Badge>
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

function Field({
    id,
    label,
    error,
    required = false,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
