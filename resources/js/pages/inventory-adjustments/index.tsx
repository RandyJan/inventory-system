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
    index as inventoryAdjustmentsIndex,
    store,
} from '@/routes/inventory-adjustments';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    MinusCircle,
    Plus,
    PlusCircle,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AdjustmentType = 'increase' | 'decrease' | 'damaged' | 'lost';

type AdjustmentLine = {
    id: number;
    item: string;
    quantity_adjusted: number;
    quantity_before: number;
    quantity_after: number;
    unit_of_measure: string;
    remarks?: string | null;
};

type Adjustment = {
    id: number;
    adjustment_number: string;
    adjustment_type: AdjustmentType;
    reason: string;
    adjustment_date: string;
    adjusted_by?: string | null;
    total_quantity_adjusted: number;
    remarks?: string | null;
    lines: AdjustmentLine[];
};

type PaginatedAdjustments = {
    data: Adjustment[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type ItemOption = {
    id: number;
    label: string;
    unit_of_measure: string;
    quantity_on_hand: number;
};

type AdjustmentFormData = {
    adjustment_number: string;
    adjustment_type: string;
    reason: string;
    adjustment_date: string;
    remarks: string;
    lines: {
        item_id: string;
        quantity_adjusted: string;
        remarks: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory Adjustments', href: inventoryAdjustmentsIndex().url },
];

export default function InventoryAdjustmentsIndex({
    adjustments,
    summary,
    items,
    types,
    reasons,
    filters,
}: {
    adjustments: PaginatedAdjustments;
    summary: {
        total: number;
        increases: number;
        decreases: number;
        damaged: number;
        lost: number;
        quantity_adjusted: number;
    };
    items: ItemOption[];
    types: AdjustmentType[];
    reasons: string[];
    filters: {
        search?: string;
        adjustment_type?: string;
        reason?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('inventory-adjustments.create');
    const [search, setSearch] = useState(filters.search ?? '');
    const [adjustmentType, setAdjustmentType] = useState(
        filters.adjustment_type || 'all',
    );
    const [reason, setReason] = useState(filters.reason || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            inventoryAdjustmentsIndex().url,
            {
                search: search || undefined,
                adjustment_type:
                    adjustmentType === 'all' ? undefined : adjustmentType,
                reason: reason === 'all' ? undefined : reason,
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
            <Head title="Inventory Adjustments" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Inventory Adjustments
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Record stock increases, decreases, damaged items,
                            and lost item adjustments.
                        </p>
                    </div>
                    {canCreate && (
                        <AdjustmentDialog
                            items={items}
                            types={types}
                            reasons={reasons}
                        />
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard
                        title="Adjustments"
                        value={summary.total}
                        icon={<SlidersHorizontal className="size-4" />}
                    />
                    <SummaryCard
                        title="Increases"
                        value={summary.increases}
                        icon={<PlusCircle className="size-4" />}
                    />
                    <SummaryCard
                        title="Decreases"
                        value={summary.decreases}
                        icon={<MinusCircle className="size-4" />}
                    />
                    <SummaryCard
                        title="Damaged"
                        value={summary.damaged}
                        icon={<AlertTriangle className="size-4" />}
                    />
                    <SummaryCard
                        title="Lost"
                        value={summary.lost}
                        icon={<ShieldAlert className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Adjustments</CardTitle>
                        <CardDescription>
                            Search by adjustment number, item, or remarks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_260px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="adjustment-search">
                                    Search
                                </Label>
                                <Input
                                    id="adjustment-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Adjustment number, item"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={adjustmentType}
                                    onValueChange={setAdjustmentType}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        {types.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {typeLabel(type)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Reason</Label>
                                <Select
                                    value={reason}
                                    onValueChange={setReason}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All reasons
                                        </SelectItem>
                                        {reasons.map((reason) => (
                                            <SelectItem
                                                key={reason}
                                                value={reason}
                                            >
                                                {reason}
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
                        <CardTitle>Adjustment History</CardTitle>
                        <CardDescription>
                            Item quantity before and after each recorded
                            adjustment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Adjustment</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead>Items</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adjustments.data.map((adjustment) => (
                                        <TableRow key={adjustment.id}>
                                            <TableCell>
                                                <div className="min-w-48 space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            adjustment.adjustment_number
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            adjustment.adjustment_date
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By{' '}
                                                        {adjustment.adjusted_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <TypeBadge
                                                    type={
                                                        adjustment.adjustment_type
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-44 text-sm">
                                                    {adjustment.reason}
                                                    {adjustment.remarks && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {adjustment.remarks}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {
                                                    adjustment.total_quantity_adjusted
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-40 gap-2 overflow-y-auto pr-1">
                                                    {adjustment.lines.map(
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
                                                                            line.quantity_adjusted
                                                                        }{' '}
                                                                        {
                                                                            line.unit_of_measure
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    Before:{' '}
                                                                    {
                                                                        line.quantity_before
                                                                    }{' '}
                                                                    to After:{' '}
                                                                    {
                                                                        line.quantity_after
                                                                    }
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {adjustments.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No inventory adjustments found.
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
                        Showing {adjustments.from ?? 0} to {adjustments.to ?? 0}{' '}
                        of {adjustments.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {adjustments.links.map((link, index) =>
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

function AdjustmentDialog({
    items,
    types,
    reasons,
}: {
    items: ItemOption[];
    types: AdjustmentType[];
    reasons: string[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<AdjustmentFormData>(adjustmentDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(adjustmentDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [
            ...form.data.lines,
            { item_id: '', quantity_adjusted: '1', remarks: '' },
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
        field: keyof AdjustmentFormData['lines'][number],
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
                    Record Adjustment
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Inventory Adjustment</DialogTitle>
                    <DialogDescription>
                        Record stock quantity corrections, damage, expired
                        items, theft, or loss.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Field
                            id="adjustment_number"
                            label="Adjustment Number"
                            error={form.errors.adjustment_number}
                        >
                            <Input
                                id="adjustment_number"
                                value={form.data.adjustment_number}
                                onChange={(event) =>
                                    form.setData(
                                        'adjustment_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="adjustment_date"
                            label="Adjustment Date"
                            error={form.errors.adjustment_date}
                            required
                        >
                            <Input
                                id="adjustment_date"
                                type="date"
                                value={form.data.adjustment_date}
                                onChange={(event) =>
                                    form.setData(
                                        'adjustment_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            id="adjustment_type"
                            label="Type"
                            error={form.errors.adjustment_type}
                            required
                        >
                            <Select
                                value={form.data.adjustment_type}
                                onValueChange={(value) =>
                                    form.setData('adjustment_type', value)
                                }
                            >
                                <SelectTrigger id="adjustment_type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {typeLabel(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field
                            id="reason"
                            label="Reason"
                            error={form.errors.reason}
                            required
                        >
                            <Select
                                value={form.data.reason}
                                onValueChange={(value) =>
                                    form.setData('reason', value)
                                }
                            >
                                <SelectTrigger id="reason">
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {reasons.map((reason) => (
                                        <SelectItem key={reason} value={reason}>
                                            {reason}
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
                                <h3 className="font-medium">Adjusted Items</h3>
                                <p className="text-sm text-muted-foreground">
                                    Decrease, damaged, and lost adjustments
                                    cannot exceed available stock.
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
                                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_170px_1fr_auto]"
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
                                                    {items.map((item) => (
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
                                                    On hand:{' '}
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
                                                    `lines.${index}.quantity_adjusted` as keyof typeof form.errors
                                                ]
                                            }
                                            required
                                        >
                                            <Input
                                                id={`lines-${index}-quantity`}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={line.quantity_adjusted}
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'quantity_adjusted',
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />
                                        </Field>
                                        <Field
                                            id={`lines-${index}-remarks`}
                                            label="Line Remarks"
                                            error={
                                                form.errors[
                                                    `lines.${index}.remarks` as keyof typeof form.errors
                                                ]
                                            }
                                        >
                                            <Input
                                                id={`lines-${index}-remarks`}
                                                value={line.remarks}
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'remarks',
                                                        event.target.value,
                                                    )
                                                }
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
                            Record Adjustment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function adjustmentDefaults(): AdjustmentFormData {
    return {
        adjustment_number: '',
        adjustment_type: 'increase',
        reason: 'Physical Count Variance',
        adjustment_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        lines: [{ item_id: '', quantity_adjusted: '1', remarks: '' }],
    };
}

function TypeBadge({ type }: { type: AdjustmentType }) {
    const className =
        type === 'increase'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
            : type === 'decrease'
              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300';

    return (
        <Badge variant="outline" className={cn('capitalize', className)}>
            {typeLabel(type)}
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

function typeLabel(type: string): string {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
