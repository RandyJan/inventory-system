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
import { index as stockCountsIndex, store } from '@/routes/stock-counts';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    ClipboardCheck,
    Diff,
    ListChecks,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type CountType = 'cycle' | 'annual';

type CountLine = {
    id: number;
    item: string;
    system_quantity: number;
    actual_quantity: number;
    variance_quantity: number;
    unit_of_measure: string;
    recommendation: string;
    remarks?: string | null;
};

type StockCount = {
    id: number;
    count_number: string;
    count_type: CountType;
    count_date: string;
    counted_by?: string | null;
    total_items_counted: number;
    variance_items_count: number;
    total_absolute_variance: number;
    remarks?: string | null;
    lines: CountLine[];
};

type PaginatedCounts = {
    data: StockCount[];
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

type StockCountFormData = {
    count_number: string;
    count_type: string;
    count_date: string;
    remarks: string;
    lines: {
        item_id: string;
        actual_quantity: string;
        remarks: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock Counts', href: stockCountsIndex().url },
];

export default function StockCountsIndex({
    counts,
    summary,
    items,
    types,
    filters,
}: {
    counts: PaginatedCounts;
    summary: {
        total: number;
        cycle: number;
        annual: number;
        with_variance: number;
        variance_lines: number;
        total_absolute_variance: number;
    };
    items: ItemOption[];
    types: CountType[];
    filters: {
        search?: string;
        count_type?: string;
        variance?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('stock-counts.create');
    const [search, setSearch] = useState(filters.search ?? '');
    const [countType, setCountType] = useState(filters.count_type || 'all');
    const [variance, setVariance] = useState(filters.variance || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            stockCountsIndex().url,
            {
                search: search || undefined,
                count_type: countType === 'all' ? undefined : countType,
                variance: variance === 'all' ? undefined : variance,
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
            <Head title="Stock Counts" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Count / Physical Inventory
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Capture cycle counts and annual inventory counts
                            with variance reporting.
                        </p>
                    </div>
                    {canCreate && (
                        <StockCountDialog items={items} types={types} />
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard
                        title="Counts"
                        value={summary.total}
                        icon={<ClipboardCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="Cycle Counts"
                        value={summary.cycle}
                        icon={<ListChecks className="size-4" />}
                    />
                    <SummaryCard
                        title="Annual Counts"
                        value={summary.annual}
                        icon={<CalendarCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="With Variance"
                        value={summary.with_variance}
                        icon={<Diff className="size-4" />}
                    />
                    <SummaryCard
                        title="Variance Qty"
                        value={summary.total_absolute_variance}
                        icon={<Diff className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Count Reports</CardTitle>
                        <CardDescription>
                            Search by count number, counted item, or remarks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="stock-count-search">
                                    Search
                                </Label>
                                <Input
                                    id="stock-count-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Count number, item"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Count Type</Label>
                                <Select
                                    value={countType}
                                    onValueChange={setCountType}
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
                                                {countTypeLabel(type)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Variance</Label>
                                <Select
                                    value={variance}
                                    onValueChange={setVariance}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All reports
                                        </SelectItem>
                                        <SelectItem value="with_variance">
                                            With variance
                                        </SelectItem>
                                        <SelectItem value="no_variance">
                                            No variance
                                        </SelectItem>
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
                        <CardTitle>Variance Report</CardTitle>
                        <CardDescription>
                            System quantity versus actual quantity, with
                            recommended stock adjustments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Count</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">
                                            Items
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Variance
                                        </TableHead>
                                        <TableHead>System vs Actual</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {counts.data.map((count) => (
                                        <TableRow key={count.id}>
                                            <TableCell>
                                                <div className="min-w-48 space-y-1">
                                                    <p className="font-medium">
                                                        {count.count_number}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {count.count_date}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By{' '}
                                                        {count.counted_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <TypeBadge
                                                    type={count.count_type}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {count.total_items_counted}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {count.variance_items_count}
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-44 gap-2 overflow-y-auto pr-1">
                                                    {count.lines.map((line) => (
                                                        <div
                                                            key={line.id}
                                                            className="rounded-md border p-2 text-sm"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <span className="font-medium">
                                                                    {line.item}
                                                                </span>
                                                                <RecommendationBadge
                                                                    recommendation={
                                                                        line.recommendation
                                                                    }
                                                                />
                                                            </div>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                System:{' '}
                                                                {
                                                                    line.system_quantity
                                                                }{' '}
                                                                Actual:{' '}
                                                                {
                                                                    line.actual_quantity
                                                                }{' '}
                                                                Variance:{' '}
                                                                {
                                                                    line.variance_quantity
                                                                }{' '}
                                                                {
                                                                    line.unit_of_measure
                                                                }
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {counts.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No stock count reports found.
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
                        Showing {counts.from ?? 0} to {counts.to ?? 0} of{' '}
                        {counts.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {counts.links.map((link, index) =>
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

function StockCountDialog({
    items,
    types,
}: {
    items: ItemOption[];
    types: CountType[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<StockCountFormData>(stockCountDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(stockCountDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [
            ...form.data.lines,
            { item_id: '', actual_quantity: '0', remarks: '' },
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
        field: keyof StockCountFormData['lines'][number],
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
                    Record Count
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Physical Inventory Count</DialogTitle>
                    <DialogDescription>
                        Enter actual quantities to compare against current
                        system quantities.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            id="count_number"
                            label="Count Number"
                            error={form.errors.count_number}
                        >
                            <Input
                                id="count_number"
                                value={form.data.count_number}
                                onChange={(event) =>
                                    form.setData(
                                        'count_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="count_date"
                            label="Count Date"
                            error={form.errors.count_date}
                            required
                        >
                            <Input
                                id="count_date"
                                type="date"
                                value={form.data.count_date}
                                onChange={(event) =>
                                    form.setData(
                                        'count_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            id="count_type"
                            label="Count Type"
                            error={form.errors.count_type}
                            required
                        >
                            <Select
                                value={form.data.count_type}
                                onValueChange={(value) =>
                                    form.setData('count_type', value)
                                }
                            >
                                <SelectTrigger id="count_type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {countTypeLabel(type)}
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
                                <h3 className="font-medium">Counted Items</h3>
                                <p className="text-sm text-muted-foreground">
                                    Variance is calculated from system quantity
                                    versus actual quantity.
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
                                                    System:{' '}
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
                                            id={`lines-${index}-actual`}
                                            label="Actual Quantity"
                                            error={
                                                form.errors[
                                                    `lines.${index}.actual_quantity` as keyof typeof form.errors
                                                ]
                                            }
                                            required
                                        >
                                            <Input
                                                id={`lines-${index}-actual`}
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.actual_quantity}
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'actual_quantity',
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
                            Generate Variance Report
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function stockCountDefaults(): StockCountFormData {
    return {
        count_number: '',
        count_type: 'cycle',
        count_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        lines: [{ item_id: '', actual_quantity: '0', remarks: '' }],
    };
}

function TypeBadge({ type }: { type: CountType }) {
    const className =
        type === 'annual'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300';

    return (
        <Badge variant="outline" className={cn('capitalize', className)}>
            {countTypeLabel(type)}
        </Badge>
    );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
    const className = recommendation.includes('Increase')
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
        : recommendation.includes('Decrease')
          ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300';

    return (
        <Badge variant="outline" className={className}>
            {recommendation}
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

function countTypeLabel(type: string): string {
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
