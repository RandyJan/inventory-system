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
import { promptText } from '@/lib/confirm';
import { cn } from '@/lib/utils';
import {
    approve,
    index as purchaseOrdersIndex,
    reject,
    store,
    submit as submitPurchaseOrder,
} from '@/routes/purchase-orders';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Plus,
    Search,
    Send,
    ShoppingCart,
    Trash2,
    XCircle,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Status = 'draft' | 'pending_approval' | 'approved' | 'rejected';

type Option = {
    id: number;
    label: string;
};

type ItemOption = Option & {
    unit_of_measure: string;
};

type PurchaseOrderLine = {
    id: number;
    item?: string | null;
    item_description: string;
    quantity_ordered: number;
    unit_of_measure: string;
    unit_cost: number;
    line_total: number;
    remarks?: string | null;
};

type PurchaseOrder = {
    id: number;
    po_number: string;
    supplier: Option;
    purchase_requisition?: Option | null;
    order_date: string;
    expected_delivery_date?: string | null;
    total_amount: number;
    status: Status;
    created_by?: string | null;
    approved_by?: string | null;
    approved_at?: string | null;
    remarks?: string | null;
    approval_remarks?: string | null;
    lines: PurchaseOrderLine[];
};

type PaginatedPurchaseOrders = {
    data: PurchaseOrder[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type PurchaseOrderFormData = {
    po_number: string;
    supplier_id: string;
    purchase_requisition_id: string;
    order_date: string;
    expected_delivery_date: string;
    remarks: string;
    submit: boolean;
    lines: {
        item_id: string;
        item_description: string;
        quantity_ordered: string;
        unit_of_measure: string;
        unit_cost: string;
        remarks: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Purchase Orders', href: purchaseOrdersIndex().url },
];

export default function PurchaseOrdersIndex({
    purchaseOrders,
    summary,
    suppliers,
    requisitions,
    items,
    statuses,
    filters,
}: {
    purchaseOrders: PaginatedPurchaseOrders;
    summary: {
        total: number;
        draft: number;
        pending_approval: number;
        approved: number;
        rejected: number;
        total_amount: number;
    };
    suppliers: Option[];
    requisitions: Option[];
    items: ItemOption[];
    statuses: Status[];
    filters: {
        search?: string;
        status?: string;
        supplier_id?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('purchase-orders.create');
    const canSubmit = permissions.has('purchase-orders.submit');
    const canApprove = permissions.has('purchase-orders.approve');
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            purchaseOrdersIndex().url,
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                supplier_id: supplierId === 'all' ? undefined : supplierId,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function submitDraft(purchaseOrder: PurchaseOrder) {
        router.post(
            submitPurchaseOrder(purchaseOrder.id).url,
            {},
            { preserveScroll: true },
        );
    }

    async function approveOrder(purchaseOrder: PurchaseOrder) {
        const approvalRemarks = await promptText({
            title: 'Approve purchase order?',
            label: 'Approval remarks',
            placeholder: 'Optional remarks',
            confirmButtonText: 'Approve',
        });

        if (approvalRemarks === null) {
            return;
        }

        router.post(
            approve(purchaseOrder.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    async function rejectOrder(purchaseOrder: PurchaseOrder) {
        const approvalRemarks = await promptText({
            title: 'Reject purchase order?',
            label: 'Reason for rejection',
            placeholder: 'Enter the rejection reason',
            required: true,
            confirmButtonText: 'Reject',
        });

        if (!approvalRemarks) {
            return;
        }

        router.post(
            reject(purchaseOrder.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Orders" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Purchase Orders
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create purchase orders, select suppliers, and route
                            POs through approval.
                        </p>
                    </div>
                    {canCreate && (
                        <PurchaseOrderDialog
                            suppliers={suppliers}
                            requisitions={requisitions}
                            items={items}
                        />
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard
                        title="Total POs"
                        value={summary.total}
                        icon={<ShoppingCart className="size-4" />}
                    />
                    <SummaryCard
                        title="Pending"
                        value={summary.pending_approval}
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
                    <SummaryCard
                        title="Total Amount"
                        value={formatMoney(summary.total_amount)}
                        icon={<ClipboardCheck className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Purchase Orders</CardTitle>
                        <CardDescription>
                            Search by PO number, supplier, requisition, or item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_260px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="po-search">Search</Label>
                                <Input
                                    id="po-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="PO number, supplier, item"
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
                                                {statusLabel(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Supplier</Label>
                                <Select
                                    value={supplierId}
                                    onValueChange={setSupplierId}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All suppliers
                                        </SelectItem>
                                        {suppliers.map((supplier) => (
                                            <SelectItem
                                                key={supplier.id}
                                                value={String(supplier.id)}
                                            >
                                                {supplier.label}
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
                        <CardTitle>Purchase Order History</CardTitle>
                        <CardDescription>
                            Supplier Selection to PO Approval Process.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                        <TableHead>Lines</TableHead>
                                        <TableHead className="text-right">
                                            Approval
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrders.data.map(
                                        (purchaseOrder) => (
                                            <TableRow key={purchaseOrder.id}>
                                                <TableCell>
                                                    <div className="min-w-44 space-y-1">
                                                        <p className="font-medium">
                                                            {
                                                                purchaseOrder.po_number
                                                            }
                                                        </p>
                                                        {purchaseOrder.purchase_requisition && (
                                                            <p className="text-sm text-muted-foreground">
                                                                PR:{' '}
                                                                {
                                                                    purchaseOrder
                                                                        .purchase_requisition
                                                                        .label
                                                                }
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            By{' '}
                                                            {purchaseOrder.created_by ||
                                                                'Unknown'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="min-w-56 text-sm">
                                                        {
                                                            purchaseOrder
                                                                .supplier.label
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="min-w-40 space-y-1 text-sm">
                                                        <p>
                                                            Order:{' '}
                                                            {
                                                                purchaseOrder.order_date
                                                            }
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            Expected:{' '}
                                                            {purchaseOrder.expected_delivery_date ||
                                                                'Not set'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        status={
                                                            purchaseOrder.status
                                                        }
                                                    />
                                                    {purchaseOrder.approved_by && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {
                                                                purchaseOrder.approved_by
                                                            }{' '}
                                                            on{' '}
                                                            {
                                                                purchaseOrder.approved_at
                                                            }
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    {formatMoney(
                                                        purchaseOrder.total_amount,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                                                        {purchaseOrder.lines.map(
                                                            (line) => (
                                                                <div
                                                                    key={
                                                                        line.id
                                                                    }
                                                                    className="rounded-md border p-2 text-sm"
                                                                >
                                                                    <div className="flex items-center justify-between gap-3">
                                                                        <span className="font-medium">
                                                                            {
                                                                                line.item_description
                                                                            }
                                                                        </span>
                                                                        <Badge variant="secondary">
                                                                            {
                                                                                line.quantity_ordered
                                                                            }{' '}
                                                                            {
                                                                                line.unit_of_measure
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        {formatMoney(
                                                                            line.line_total,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {canSubmit &&
                                                            purchaseOrder.status ===
                                                                'draft' && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        submitDraft(
                                                                            purchaseOrder,
                                                                        )
                                                                    }
                                                                >
                                                                    <Send className="size-4" />
                                                                    Submit
                                                                </Button>
                                                            )}
                                                        {canApprove &&
                                                            purchaseOrder.status ===
                                                                'pending_approval' && (
                                                                <>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            approveOrder(
                                                                                purchaseOrder,
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
                                                                            rejectOrder(
                                                                                purchaseOrder,
                                                                            )
                                                                        }
                                                                    >
                                                                        <XCircle className="size-4" />
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                        {!(
                                                            (canSubmit &&
                                                                purchaseOrder.status ===
                                                                    'draft') ||
                                                            (canApprove &&
                                                                purchaseOrder.status ===
                                                                    'pending_approval')
                                                        ) && (
                                                            <span className="text-sm text-muted-foreground">
                                                                No action
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                    {purchaseOrders.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No purchase orders found.
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
                        Showing {purchaseOrders.from ?? 0} to{' '}
                        {purchaseOrders.to ?? 0} of {purchaseOrders.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {purchaseOrders.links.map((link, index) =>
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

function PurchaseOrderDialog({
    suppliers,
    requisitions,
    items,
}: {
    suppliers: Option[];
    requisitions: Option[];
    items: ItemOption[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<PurchaseOrderFormData>(purchaseOrderDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(purchaseOrderDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [...form.data.lines, lineDefaults()]);
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
        field: keyof PurchaseOrderFormData['lines'][number],
        value: string,
    ) {
        form.setData(
            'lines',
            form.data.lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    }

    function selectItem(index: number, value: string) {
        const selectedItem = items.find((item) => String(item.id) === value);

        form.setData(
            'lines',
            form.data.lines.map((line, lineIndex) =>
                lineIndex === index
                    ? {
                          ...line,
                          item_id: value === 'custom' ? '' : value,
                          item_description:
                              value === 'custom'
                                  ? line.item_description
                                  : selectedItem?.label ||
                                    line.item_description,
                          unit_of_measure:
                              value === 'custom'
                                  ? line.unit_of_measure
                                  : selectedItem?.unit_of_measure ||
                                    line.unit_of_measure,
                      }
                    : line,
            ),
        );
    }

    function submit(shouldSubmit: boolean) {
        form.transform((data) => ({ ...data, submit: shouldSubmit }));
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
                    New Purchase Order
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Select a supplier, enter PO dates, and add ordered
                        items.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="po_number"
                            label="PO Number"
                            error={form.errors.po_number}
                        >
                            <Input
                                id="po_number"
                                value={form.data.po_number}
                                onChange={(event) =>
                                    form.setData(
                                        'po_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="supplier_id"
                            label="Supplier"
                            error={form.errors.supplier_id}
                            required
                        >
                            <Select
                                value={form.data.supplier_id}
                                onValueChange={(value) =>
                                    form.setData('supplier_id', value)
                                }
                            >
                                <SelectTrigger id="supplier_id">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem
                                            key={supplier.id}
                                            value={String(supplier.id)}
                                        >
                                            {supplier.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            id="order_date"
                            label="Order Date"
                            error={form.errors.order_date}
                            required
                        >
                            <Input
                                id="order_date"
                                type="date"
                                value={form.data.order_date}
                                onChange={(event) =>
                                    form.setData(
                                        'order_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            id="expected_delivery_date"
                            label="Expected Delivery Date"
                            error={form.errors.expected_delivery_date}
                        >
                            <Input
                                id="expected_delivery_date"
                                type="date"
                                value={form.data.expected_delivery_date}
                                onChange={(event) =>
                                    form.setData(
                                        'expected_delivery_date',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            id="purchase_requisition_id"
                            label="Approved Requisition"
                            error={form.errors.purchase_requisition_id}
                        >
                            <Select
                                value={
                                    form.data.purchase_requisition_id || 'none'
                                }
                                onValueChange={(value) =>
                                    form.setData(
                                        'purchase_requisition_id',
                                        value === 'none' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger id="purchase_requisition_id">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No linked requisition
                                    </SelectItem>
                                    {requisitions.map((requisition) => (
                                        <SelectItem
                                            key={requisition.id}
                                            value={String(requisition.id)}
                                        >
                                            {requisition.label}
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
                                <h3 className="font-medium">Order Items</h3>
                                <p className="text-sm text-muted-foreground">
                                    Add catalog-linked or custom purchase order
                                    lines.
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

                        <div className="space-y-3">
                            {form.data.lines.map((line, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_120px_120px_140px_auto]"
                                >
                                    <Field
                                        id={`lines-${index}-item`}
                                        label="Catalog Item"
                                        error={
                                            form.errors[
                                                `lines.${index}.item_id` as keyof typeof form.errors
                                            ]
                                        }
                                    >
                                        <Select
                                            value={line.item_id || 'custom'}
                                            onValueChange={(value) =>
                                                selectItem(index, value)
                                            }
                                        >
                                            <SelectTrigger
                                                id={`lines-${index}-item`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="custom">
                                                    Custom item
                                                </SelectItem>
                                                {items.map((item) => (
                                                    <SelectItem
                                                        key={item.id}
                                                        value={String(item.id)}
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field
                                        id={`lines-${index}-description`}
                                        label="Description"
                                        error={
                                            form.errors[
                                                `lines.${index}.item_description` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-description`}
                                            value={line.item_description}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'item_description',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </Field>
                                    <Field
                                        id={`lines-${index}-quantity`}
                                        label="Qty"
                                        error={
                                            form.errors[
                                                `lines.${index}.quantity_ordered` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-quantity`}
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={line.quantity_ordered}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'quantity_ordered',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </Field>
                                    <Field
                                        id={`lines-${index}-unit`}
                                        label="Unit"
                                        error={
                                            form.errors[
                                                `lines.${index}.unit_of_measure` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-unit`}
                                            value={line.unit_of_measure}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'unit_of_measure',
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </Field>
                                    <Field
                                        id={`lines-${index}-cost`}
                                        label="Unit Cost"
                                        error={
                                            form.errors[
                                                `lines.${index}.unit_cost` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-cost`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unit_cost}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'unit_cost',
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
                                            onClick={() => removeLine(index)}
                                        >
                                            <Trash2 className="size-4" />
                                            <span className="sr-only">
                                                Remove line
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => submit(false)}
                        >
                            Save Draft
                        </Button>
                        <Button
                            type="button"
                            disabled={form.processing}
                            onClick={() => submit(true)}
                        >
                            Submit
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function purchaseOrderDefaults(): PurchaseOrderFormData {
    return {
        po_number: '',
        supplier_id: '',
        purchase_requisition_id: '',
        order_date: new Date().toISOString().slice(0, 10),
        expected_delivery_date: '',
        remarks: '',
        submit: false,
        lines: [lineDefaults()],
    };
}

function lineDefaults(): PurchaseOrderFormData['lines'][number] {
    return {
        item_id: '',
        item_description: '',
        quantity_ordered: '1',
        unit_of_measure: 'PCS',
        unit_cost: '0',
        remarks: '',
    };
}

function StatusBadge({ status }: { status: Status }) {
    const className =
        status === 'approved'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
            : status === 'rejected'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              : status === 'pending_approval'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300';

    return (
        <Badge variant="outline" className={className}>
            {statusLabel(status)}
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

function statusLabel(status: string): string {
    return status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(value);
}
