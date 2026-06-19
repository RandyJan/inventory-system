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
    convert,
    index as purchaseRequisitionsIndex,
    reject,
    store,
    submit as submitRequisition,
} from '@/routes/purchase-requisitions';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    FileCheck2,
    FileClock,
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

type Status =
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'converted_to_purchase_order';

type ItemOption = {
    id: number;
    label: string;
    unit_of_measure: string;
};

type RequisitionLine = {
    id: number;
    item?: string | null;
    item_description: string;
    quantity_requested: number;
    unit_of_measure: string;
    estimated_unit_cost: number;
    line_total: number;
    remarks?: string | null;
};

type Requisition = {
    id: number;
    requisition_number: string;
    requesting_department: string;
    purpose: string;
    needed_date?: string | null;
    requested_by?: string | null;
    supervisor?: string | null;
    purchasing_officer?: string | null;
    purchase_order_reference?: string | null;
    status: Status;
    estimated_total: number;
    remarks?: string | null;
    approval_remarks?: string | null;
    submitted_at?: string | null;
    approved_at?: string | null;
    converted_at?: string | null;
    lines: RequisitionLine[];
};

type PaginatedRequisitions = {
    data: Requisition[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type RequisitionFormData = {
    requisition_number: string;
    requesting_department: string;
    purpose: string;
    needed_date: string;
    remarks: string;
    submit: boolean;
    lines: {
        item_id: string;
        item_description: string;
        quantity_requested: string;
        unit_of_measure: string;
        estimated_unit_cost: string;
        remarks: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Purchase Requisitions', href: purchaseRequisitionsIndex().url },
];

export default function PurchaseRequisitionsIndex({
    requisitions,
    summary,
    items,
    statuses,
    filters,
}: {
    requisitions: PaginatedRequisitions;
    summary: {
        total: number;
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        converted_to_purchase_order: number;
    };
    items: ItemOption[];
    statuses: Status[];
    filters: {
        search?: string;
        status?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('purchase-requisitions.create');
    const canSubmit = permissions.has('purchase-requisitions.submit');
    const canApprove = permissions.has('purchase-requisitions.approve');
    const canConvert = permissions.has('purchase-requisitions.convert');
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            purchaseRequisitionsIndex().url,
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

    function submitDraft(requisition: Requisition) {
        router.post(
            submitRequisition(requisition.id).url,
            {},
            { preserveScroll: true },
        );
    }

    async function approveRequest(requisition: Requisition) {
        const approvalRemarks = await promptText({
            title: 'Approve purchase request?',
            label: 'Approval remarks',
            placeholder: 'Optional remarks',
            confirmButtonText: 'Approve',
        });

        if (approvalRemarks === null) {
            return;
        }

        router.post(
            approve(requisition.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    async function rejectRequest(requisition: Requisition) {
        const approvalRemarks = await promptText({
            title: 'Reject purchase request?',
            label: 'Reason for rejection',
            placeholder: 'Enter the rejection reason',
            required: true,
            confirmButtonText: 'Reject',
        });

        if (!approvalRemarks) {
            return;
        }

        router.post(
            reject(requisition.id).url,
            { approval_remarks: approvalRemarks },
            { preserveScroll: true },
        );
    }

    async function convertRequest(requisition: Requisition) {
        const purchaseOrderReference = await promptText({
            title: 'Convert to purchase order?',
            label: 'Purchase order reference',
            placeholder: 'Optional PO reference',
            confirmButtonText: 'Convert',
        });

        if (purchaseOrderReference === null) {
            return;
        }

        router.post(
            convert(requisition.id).url,
            { purchase_order_reference: purchaseOrderReference },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Requisitions" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Purchase Requisitions
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Create purchase requests, route them for supervisor
                            approval, and track Purchasing conversion.
                        </p>
                    </div>
                    {canCreate && <RequisitionDialog items={items} />}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard
                        title="Total"
                        value={summary.total}
                        icon={<ClipboardList className="size-4" />}
                    />
                    <SummaryCard
                        title="Submitted"
                        value={summary.submitted}
                        icon={<FileClock className="size-4" />}
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
                        title="Converted"
                        value={summary.converted_to_purchase_order}
                        icon={<ShoppingCart className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Purchase Requests</CardTitle>
                        <CardDescription>
                            Search by requisition number, department, purpose,
                            PO reference, or item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_260px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="requisition-search">
                                    Search
                                </Label>
                                <Input
                                    id="requisition-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="PR number, department, item"
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
                            <Button type="submit" className="md:self-end">
                                <Search className="size-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Requisition History</CardTitle>
                        <CardDescription>
                            Requester to Supervisor Approval to Purchasing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Estimate
                                        </TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">
                                            Workflow
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requisitions.data.map((requisition) => (
                                        <TableRow key={requisition.id}>
                                            <TableCell>
                                                <div className="min-w-56 space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            requisition.requisition_number
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            requisition.requesting_department
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {requisition.purpose}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By{' '}
                                                        {requisition.requested_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={requisition.status}
                                                />
                                                {requisition.purchase_order_reference && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        PO:{' '}
                                                        {
                                                            requisition.purchase_order_reference
                                                        }
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatMoney(
                                                    requisition.estimated_total,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                                                    {requisition.lines.map(
                                                        (line) => (
                                                            <div
                                                                key={line.id}
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
                                                                            line.quantity_requested
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
                                                        requisition.status ===
                                                            'draft' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    submitDraft(
                                                                        requisition,
                                                                    )
                                                                }
                                                            >
                                                                <Send className="size-4" />
                                                                Submit
                                                            </Button>
                                                        )}
                                                    {canApprove &&
                                                        requisition.status ===
                                                            'submitted' && (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        approveRequest(
                                                                            requisition,
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
                                                                        rejectRequest(
                                                                            requisition,
                                                                        )
                                                                    }
                                                                >
                                                                    <XCircle className="size-4" />
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    {canConvert &&
                                                        requisition.status ===
                                                            'approved' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    convertRequest(
                                                                        requisition,
                                                                    )
                                                                }
                                                            >
                                                                <FileCheck2 className="size-4" />
                                                                Convert
                                                            </Button>
                                                        )}
                                                    {!(
                                                        (canSubmit &&
                                                            requisition.status ===
                                                                'draft') ||
                                                        (canApprove &&
                                                            requisition.status ===
                                                                'submitted') ||
                                                        (canConvert &&
                                                            requisition.status ===
                                                                'approved')
                                                    ) && (
                                                        <span className="text-sm text-muted-foreground">
                                                            No action
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {requisitions.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No purchase requisitions found.
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
                        Showing {requisitions.from ?? 0} to{' '}
                        {requisitions.to ?? 0} of {requisitions.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {requisitions.links.map((link, index) =>
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

function RequisitionDialog({ items }: { items: ItemOption[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm<RequisitionFormData>(requisitionDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(requisitionDefaults());
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
        field: keyof RequisitionFormData['lines'][number],
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
                    New Requisition
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Create Purchase Request</DialogTitle>
                    <DialogDescription>
                        Save as draft or submit directly for supervisor
                        approval.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="requisition_number"
                            label="Requisition Number"
                            error={form.errors.requisition_number}
                        >
                            <Input
                                id="requisition_number"
                                value={form.data.requisition_number}
                                onChange={(event) =>
                                    form.setData(
                                        'requisition_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="needed_date"
                            label="Needed Date"
                            error={form.errors.needed_date}
                        >
                            <Input
                                id="needed_date"
                                type="date"
                                value={form.data.needed_date}
                                onChange={(event) =>
                                    form.setData(
                                        'needed_date',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="requesting_department"
                            label="Requesting Department"
                            error={form.errors.requesting_department}
                            required
                        >
                            <Input
                                id="requesting_department"
                                value={form.data.requesting_department}
                                onChange={(event) =>
                                    form.setData(
                                        'requesting_department',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            id="purpose"
                            label="Purpose"
                            error={form.errors.purpose}
                            required
                        >
                            <Input
                                id="purpose"
                                value={form.data.purpose}
                                onChange={(event) =>
                                    form.setData('purpose', event.target.value)
                                }
                                required
                            />
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
                                <h3 className="font-medium">Requested Items</h3>
                                <p className="text-sm text-muted-foreground">
                                    Add inventory-linked or custom requested
                                    items.
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
                                                `lines.${index}.quantity_requested` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-quantity`}
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={line.quantity_requested}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'quantity_requested',
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
                                        label="Est. Unit Cost"
                                        error={
                                            form.errors[
                                                `lines.${index}.estimated_unit_cost` as keyof typeof form.errors
                                            ]
                                        }
                                        required
                                    >
                                        <Input
                                            id={`lines-${index}-cost`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.estimated_unit_cost}
                                            onChange={(event) =>
                                                updateLine(
                                                    index,
                                                    'estimated_unit_cost',
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

function requisitionDefaults(): RequisitionFormData {
    return {
        requisition_number: '',
        requesting_department: '',
        purpose: '',
        needed_date: '',
        remarks: '',
        submit: false,
        lines: [lineDefaults()],
    };
}

function lineDefaults(): RequisitionFormData['lines'][number] {
    return {
        item_id: '',
        item_description: '',
        quantity_requested: '1',
        unit_of_measure: 'PCS',
        estimated_unit_cost: '0',
        remarks: '',
    };
}

function StatusBadge({ status }: { status: Status }) {
    const className =
        status === 'approved' || status === 'converted_to_purchase_order'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
            : status === 'rejected'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
              : status === 'submitted'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300';

    return (
        <Badge variant="outline" className={cn(className)}>
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
