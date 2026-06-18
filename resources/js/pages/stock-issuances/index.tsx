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
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { index as stockIssuancesIndex, store } from '@/routes/stock-issuances';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
    PackageMinus,
    Plus,
    Printer,
    Search,
    Trash2,
    UserRound,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type IssuanceLine = {
    id: number;
    item: string;
    quantity_issued: number;
    unit_of_measure: string;
};

type Issuance = {
    id: number;
    issue_number: string;
    requesting_department: string;
    requestor: string;
    date_issued: string;
    released_by?: string | null;
    total_quantity_issued: number;
    lines: IssuanceLine[];
};

type PaginatedIssuances = {
    data: Issuance[];
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

type IssuanceFormData = {
    issue_number: string;
    requesting_department: string;
    requestor: string;
    date_issued: string;
    lines: {
        item_id: string;
        quantity_issued: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock Issuance', href: stockIssuancesIndex().url },
];

export default function StockIssuancesIndex({
    issuances,
    summary,
    departments,
    items,
    filters,
}: {
    issuances: PaginatedIssuances;
    summary: {
        total: number;
        issued_this_month: number;
        total_quantity: number;
        departments_served: number;
    };
    departments: string[];
    items: ItemOption[];
    filters: {
        search?: string;
        department?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('stock-issuances.create');
    const [search, setSearch] = useState(filters.search ?? '');
    const [department, setDepartment] = useState(filters.department || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            stockIssuancesIndex().url,
            {
                search: search || undefined,
                department: department === 'all' ? undefined : department,
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
            <Head title="Stock Issuance" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Issuance
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Release inventory to departments, track issued
                            items, and generate issuance slips.
                        </p>
                    </div>
                    {canCreate && <IssuanceDialog items={items} />}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Issuance Slips"
                        value={summary.total}
                        icon={<ClipboardList className="size-4" />}
                    />
                    <SummaryCard
                        title="This Month"
                        value={summary.issued_this_month}
                        icon={<PackageMinus className="size-4" />}
                    />
                    <SummaryCard
                        title="Quantity Issued"
                        value={summary.total_quantity}
                        icon={<PackageMinus className="size-4" />}
                    />
                    <SummaryCard
                        title="Departments Served"
                        value={summary.departments_served}
                        icon={<Building2 className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Issuance Slips</CardTitle>
                        <CardDescription>
                            Search by issue number, department, requestor, or
                            item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_280px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="issuance-search">Search</Label>
                                <Input
                                    id="issuance-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Issue number, requestor, item"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Department</Label>
                                <Select
                                    value={department}
                                    onValueChange={setDepartment}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All departments
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                key={department}
                                                value={department}
                                            >
                                                {department}
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
                        <CardTitle>Issuance History</CardTitle>
                        <CardDescription>
                            Requesting Department to Stock Release to Issuance
                            Slip.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Issue Slip</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Date Issued</TableHead>
                                        <TableHead className="text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">
                                            Slip
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issuances.data.map((issuance) => (
                                        <TableRow key={issuance.id}>
                                            <TableCell>
                                                <div className="min-w-44 space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            issuance.issue_number
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Requestor:{' '}
                                                        {issuance.requestor}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Released by{' '}
                                                        {issuance.released_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-48 text-sm">
                                                    {
                                                        issuance.requesting_department
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {issuance.date_issued}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {issuance.total_quantity_issued}
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                                                    {issuance.lines.map(
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
                                                                            line.quantity_issued
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
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        printIssuanceSlip(
                                                            issuance,
                                                        )
                                                    }
                                                >
                                                    <Printer className="size-4" />
                                                    <span className="sr-only">
                                                        Print issuance slip
                                                    </span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {issuances.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No issuance slips found.
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
                        Showing {issuances.from ?? 0} to {issuances.to ?? 0} of{' '}
                        {issuances.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {issuances.links.map((link, index) =>
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

function IssuanceDialog({ items }: { items: ItemOption[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm<IssuanceFormData>(issuanceDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(issuanceDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [
            ...form.data.lines,
            { item_id: '', quantity_issued: '1' },
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
        field: keyof IssuanceFormData['lines'][number],
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
                    Issue Stock
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Release Inventory</DialogTitle>
                    <DialogDescription>
                        Record department issuance and deduct released
                        quantities from inventory.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="issue_number"
                            label="Issue Number"
                            error={form.errors.issue_number}
                        >
                            <Input
                                id="issue_number"
                                value={form.data.issue_number}
                                onChange={(event) =>
                                    form.setData(
                                        'issue_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="date_issued"
                            label="Date Issued"
                            error={form.errors.date_issued}
                            required
                        >
                            <Input
                                id="date_issued"
                                type="date"
                                value={form.data.date_issued}
                                onChange={(event) =>
                                    form.setData(
                                        'date_issued',
                                        event.target.value,
                                    )
                                }
                                required
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
                                placeholder="Administration"
                                required
                            />
                        </Field>
                        <Field
                            id="requestor"
                            label="Requestor"
                            error={form.errors.requestor}
                            required
                        >
                            <Input
                                id="requestor"
                                value={form.data.requestor}
                                onChange={(event) =>
                                    form.setData(
                                        'requestor',
                                        event.target.value,
                                    )
                                }
                                placeholder="Employee name"
                                required
                            />
                        </Field>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-medium">
                                    Items to Release
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Select inventory items and verify the
                                    quantity issued.
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
                                            label="Quantity Issued"
                                            error={
                                                form.errors[
                                                    `lines.${index}.quantity_issued` as keyof typeof form.errors
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
                                                value={line.quantity_issued}
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'quantity_issued',
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
                            Record Issuance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function issuanceDefaults(): IssuanceFormData {
    return {
        issue_number: '',
        requesting_department: '',
        requestor: '',
        date_issued: new Date().toISOString().slice(0, 10),
        lines: [{ item_id: '', quantity_issued: '1' }],
    };
}

function printIssuanceSlip(issuance: Issuance) {
    const rows = issuance.lines
        .map(
            (line) => `
                <tr>
                    <td>${escapeHtml(line.item)}</td>
                    <td style="text-align: right;">${line.quantity_issued}</td>
                    <td>${escapeHtml(line.unit_of_measure)}</td>
                </tr>
            `,
        )
        .join('');

    const slip = window.open('', '_blank', 'width=900,height=700');

    if (!slip) {
        return;
    }

    slip.document.write(`
        <html>
            <head>
                <title>Issuance Slip ${escapeHtml(issuance.issue_number)}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
                    h1 { margin: 0 0 4px; font-size: 24px; }
                    .muted { color: #4b5563; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin: 24px 0; }
                    .label { display: block; color: #6b7280; font-size: 12px; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
                    th { background: #f3f4f6; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 72px; }
                    .line { border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
                </style>
            </head>
            <body>
                <h1>Stock Issuance Slip</h1>
                <div class="muted">${escapeHtml(issuance.issue_number)}</div>
                <div class="grid">
                    <div><span class="label">Requesting Department</span>${escapeHtml(issuance.requesting_department)}</div>
                    <div><span class="label">Date Issued</span>${escapeHtml(issuance.date_issued)}</div>
                    <div><span class="label">Requestor</span>${escapeHtml(issuance.requestor)}</div>
                    <div><span class="label">Released By</span>${escapeHtml(issuance.released_by || 'Unknown')}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: right;">Quantity Issued</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="signatures">
                    <div class="line">Released By</div>
                    <div class="line">Received By</div>
                </div>
                <script>window.print();</script>
            </body>
        </html>
    `);
    slip.document.close();
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
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
