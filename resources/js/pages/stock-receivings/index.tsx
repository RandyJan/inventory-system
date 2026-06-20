import InputError from '@/components/input-error';
import { InventoryScanner } from '@/components/inventory-code-tools';
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
    index as stockReceivingsIndex,
    store,
} from '@/routes/stock-receivings';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ClipboardCheck,
    PackageCheck,
    Plus,
    Search,
    Trash2,
    Truck,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type ReceivingLine = {
    id: number;
    item: string;
    quantity_received: number;
    unit_of_measure: string;
    remarks?: string | null;
};

type Receiving = {
    id: number;
    receiving_number: string;
    supplier: {
        id: number;
        label: string;
    };
    delivery_date: string;
    purchase_order_reference?: string | null;
    received_by?: string | null;
    total_quantity_received: number;
    remarks?: string | null;
    lines: ReceivingLine[];
};

type PaginatedReceivings = {
    data: Receiving[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type Option = {
    id: number;
    label: string;
};

type ItemOption = Option & {
    item_code?: string | null;
    barcode?: string | null;
    unit_of_measure: string;
    quantity_on_hand: number;
};

type ReceivingFormData = {
    receiving_number: string;
    supplier_id: string;
    delivery_date: string;
    purchase_order_reference: string;
    remarks: string;
    lines: {
        item_id: string;
        quantity_received: string;
        remarks: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Stock Receiving', href: stockReceivingsIndex().url },
];

export default function StockReceivingsIndex({
    receivings,
    summary,
    suppliers,
    items,
    filters,
}: {
    receivings: PaginatedReceivings;
    summary: {
        total: number;
        received_this_month: number;
        total_quantity: number;
        suppliers_served: number;
    };
    suppliers: Option[];
    items: ItemOption[];
    filters: {
        search?: string;
        supplier_id?: string;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('stock-receivings.create');
    const [search, setSearch] = useState(filters.search ?? '');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            stockReceivingsIndex().url,
            {
                search: search || undefined,
                supplier_id: supplierId === 'all' ? undefined : supplierId,
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
            <Head title="Stock Receiving" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Stock Receiving
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Receive purchased items, verify received quantities,
                            and update inventory stock.
                        </p>
                    </div>
                    {canCreate && (
                        <ReceivingDialog suppliers={suppliers} items={items} />
                    )}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Receiving Transactions"
                        value={summary.total}
                        icon={<ClipboardCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="This Month"
                        value={summary.received_this_month}
                        icon={<PackageCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="Quantity Received"
                        value={summary.total_quantity}
                        icon={<PackageCheck className="size-4" />}
                    />
                    <SummaryCard
                        title="Suppliers Served"
                        value={summary.suppliers_served}
                        icon={<Truck className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Receiving Transactions</CardTitle>
                        <CardDescription>
                            Search by receiving number, purchase order
                            reference, or supplier.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_280px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="receiving-search">Search</Label>
                                <Input
                                    id="receiving-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="RCV number, PO reference, supplier"
                                />
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
                        <CardTitle>Receiving History</CardTitle>
                        <CardDescription>
                            Purchase Order to Receiving to Inventory Update.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receiving</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Delivery</TableHead>
                                        <TableHead className="text-right">
                                            Qty
                                        </TableHead>
                                        <TableHead>Lines</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receivings.data.map((receiving) => (
                                        <TableRow key={receiving.id}>
                                            <TableCell>
                                                <div className="min-w-44 space-y-1">
                                                    <p className="font-medium">
                                                        {
                                                            receiving.receiving_number
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        PO:{' '}
                                                        {receiving.purchase_order_reference ||
                                                            'No reference'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        By{' '}
                                                        {receiving.received_by ||
                                                            'Unknown'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-56 text-sm">
                                                    {receiving.supplier.label}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {receiving.delivery_date}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {
                                                    receiving.total_quantity_received
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                                                    {receiving.lines.map(
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
                                                                            line.quantity_received
                                                                        }{' '}
                                                                        {
                                                                            line.unit_of_measure
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                {line.remarks && (
                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        {
                                                                            line.remarks
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {receivings.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No receiving transactions found.
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
                        Showing {receivings.from ?? 0} to {receivings.to ?? 0}{' '}
                        of {receivings.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {receivings.links.map((link, index) =>
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

function ReceivingDialog({
    suppliers,
    items,
}: {
    suppliers: Option[];
    items: ItemOption[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<ReceivingFormData>(receivingDefaults());

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(receivingDefaults());
        }
    }

    function addLine() {
        form.setData('lines', [
            ...form.data.lines,
            { item_id: '', quantity_received: '1', remarks: '' },
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
        field: keyof ReceivingFormData['lines'][number],
        value: string,
    ) {
        form.setData(
            'lines',
            form.data.lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    }

    function handleScannedItem(item: ItemOption) {
        const itemId = String(item.id);
        const existingLineIndex = form.data.lines.findIndex(
            (line) => line.item_id === itemId,
        );
        const emptyLineIndex = form.data.lines.findIndex(
            (line) => !line.item_id,
        );

        if (existingLineIndex >= 0) {
            form.setData(
                'lines',
                form.data.lines.map((line, lineIndex) =>
                    lineIndex === existingLineIndex
                        ? {
                              ...line,
                              quantity_received: String(
                                  Number(line.quantity_received || 0) + 1,
                              ),
                          }
                        : line,
                ),
            );

            return;
        }

        if (emptyLineIndex >= 0) {
            form.setData(
                'lines',
                form.data.lines.map((line, lineIndex) =>
                    lineIndex === emptyLineIndex
                        ? { ...line, item_id: itemId, quantity_received: '1' }
                        : line,
                ),
            );

            return;
        }

        form.setData('lines', [
            ...form.data.lines,
            { item_id: itemId, quantity_received: '1', remarks: '' },
        ]);
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
                    Receive Stock
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Receive Purchased Items</DialogTitle>
                    <DialogDescription>
                        Verify quantities received and record the receiving
                        transaction.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="receiving_number"
                            label="Receiving Number"
                            error={form.errors.receiving_number}
                        >
                            <Input
                                id="receiving_number"
                                value={form.data.receiving_number}
                                onChange={(event) =>
                                    form.setData(
                                        'receiving_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="Auto-generated if blank"
                            />
                        </Field>
                        <Field
                            id="delivery_date"
                            label="Delivery Date"
                            error={form.errors.delivery_date}
                            required
                        >
                            <Input
                                id="delivery_date"
                                type="date"
                                value={form.data.delivery_date}
                                onChange={(event) =>
                                    form.setData(
                                        'delivery_date',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
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
                        <Field
                            id="purchase_order_reference"
                            label="Purchase Order Reference"
                            error={form.errors.purchase_order_reference}
                        >
                            <Input
                                id="purchase_order_reference"
                                value={form.data.purchase_order_reference}
                                onChange={(event) =>
                                    form.setData(
                                        'purchase_order_reference',
                                        event.target.value,
                                    )
                                }
                                placeholder="PO-000001"
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
                                <h3 className="font-medium">
                                    Quantity Verification
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Add each purchased item and confirm the
                                    quantity received.
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

                        <InventoryScanner
                            items={items}
                            contextLabel="receiving"
                            onScan={handleScannedItem}
                        />

                        <div className="space-y-3">
                            {form.data.lines.map((line, index) => {
                                const selectedItem = items.find(
                                    (item) => String(item.id) === line.item_id,
                                );

                                return (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_160px_1fr_auto]"
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
                                            label="Quantity Received"
                                            error={
                                                form.errors[
                                                    `lines.${index}.quantity_received` as keyof typeof form.errors
                                                ]
                                            }
                                            required
                                        >
                                            <Input
                                                id={`lines-${index}-quantity`}
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={line.quantity_received}
                                                onChange={(event) =>
                                                    updateLine(
                                                        index,
                                                        'quantity_received',
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
                            Record Receiving
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function receivingDefaults(): ReceivingFormData {
    return {
        receiving_number: '',
        supplier_id: '',
        delivery_date: new Date().toISOString().slice(0, 10),
        purchase_order_reference: '',
        remarks: '',
        lines: [{ item_id: '', quantity_received: '1', remarks: '' }],
    };
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
