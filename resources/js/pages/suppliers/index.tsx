import SupplierManagementController from '@/actions/App/Http/Controllers/SupplierManagementController';
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
import { index as suppliersIndex } from '@/routes/suppliers';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    Pencil,
    Plus,
    Search,
    TimerReset,
    Truck,
} from 'lucide-react';
import { FormEvent, type ReactNode, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Supplier = {
    id: number;
    supplier_code: string;
    company_name: string;
    contact_person?: string | null;
    email_address?: string | null;
    phone_number?: string | null;
    address?: string | null;
    tax_identification_number?: string | null;
    status: string;
    total_orders: number;
    fulfilled_orders: number;
    late_deliveries: number;
    performance_score?: number | string | null;
    last_delivery_at?: string | null;
    updated_at?: string | null;
};

type PaginatedSuppliers = {
    data: Supplier[];
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type StatusOption = {
    value: string;
    label: string;
};

type SupplierFormData = {
    supplier_code: string;
    company_name: string;
    contact_person: string;
    email_address: string;
    phone_number: string;
    address: string;
    tax_identification_number: string;
    status: string;
    total_orders: number | string;
    fulfilled_orders: number | string;
    late_deliveries: number | string;
    performance_score: number | string;
    last_delivery_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Supplier Management', href: suppliersIndex().url },
];

export default function SuppliersIndex({
    suppliers,
    summary,
    statuses,
    filters,
}: {
    suppliers: PaginatedSuppliers;
    summary: {
        total: number;
        active: number;
        on_hold: number;
        average_performance: number;
        late_delivery_rate: number;
    };
    statuses: StatusOption[];
    filters: {
        search?: string;
        status?: string;
        per_page?: number;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreate = permissions.has('suppliers.create');
    const canUpdate = permissions.has('suppliers.update');
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status || 'all');

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            suppliersIndex().url,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier Management" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Supplier Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Register suppliers, maintain supplier records, and
                            track fulfillment performance.
                        </p>
                    </div>

                    {canCreate && <SupplierFormDialog statuses={statuses} />}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Suppliers"
                        value={summary.total}
                        icon={<Building2 className="size-4" />}
                    />
                    <SummaryCard
                        title="Active"
                        value={summary.active}
                        icon={<Truck className="size-4" />}
                    />
                    <SummaryCard
                        title="Avg. performance"
                        value={`${summary.average_performance}%`}
                        icon={<Activity className="size-4" />}
                    />
                    <SummaryCard
                        title="Late delivery rate"
                        value={`${summary.late_delivery_rate}%`}
                        icon={<TimerReset className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Suppliers</CardTitle>
                        <CardDescription>
                            Search by supplier code, company, contact person, or
                            email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="supplier-search">Search</Label>
                                <Input
                                    id="supplier-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Code, company, contact, email"
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
                                        {statuses.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
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
                        <CardTitle>Supplier Maintenance</CardTitle>
                        <CardDescription>
                            Supplier Information and performance tracking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Performance
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Orders
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.data.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                <div className="min-w-56 space-y-1">
                                                    <p className="font-medium">
                                                        {supplier.company_name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                        <span>
                                                            {
                                                                supplier.supplier_code
                                                            }
                                                        </span>
                                                        {supplier.tax_identification_number && (
                                                            <span>
                                                                TIN:{' '}
                                                                {
                                                                    supplier.tax_identification_number
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="min-w-52 space-y-1 text-sm">
                                                    <p>
                                                        {supplier.contact_person ||
                                                            'No contact person'}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {supplier.email_address ||
                                                            supplier.phone_number ||
                                                            'No contact details'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={supplier.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatScore(
                                                    supplier.performance_score,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right text-sm tabular-nums">
                                                <div>
                                                    {supplier.fulfilled_orders}/
                                                    {supplier.total_orders}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {supplier.late_deliveries}{' '}
                                                    late
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    {canUpdate && (
                                                        <SupplierFormDialog
                                                            supplier={supplier}
                                                            statuses={statuses}
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {suppliers.data.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No suppliers found.
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
                        Showing {suppliers.from ?? 0} to {suppliers.to ?? 0} of{' '}
                        {suppliers.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {suppliers.links.map((link, index) =>
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

function SupplierFormDialog({
    supplier,
    statuses,
}: {
    supplier?: Supplier;
    statuses: StatusOption[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<SupplierFormData>(supplierFormDefaults(supplier));

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(supplierFormDefaults(supplier));
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        };

        if (supplier) {
            form.put(
                SupplierManagementController.update(supplier.id).url,
                options,
            );

            return;
        }

        form.post(SupplierManagementController.store().url, options);
    }

    return (
        <Dialog open={open} onOpenChange={openDialog}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant={supplier ? 'outline' : 'default'}
                    size={supplier ? 'sm' : 'default'}
                >
                    {supplier ? <Pencil /> : <Plus />}
                    {supplier ? 'Maintain' : 'Register supplier'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {supplier
                            ? 'Supplier Maintenance'
                            : 'Supplier Registration'}
                    </DialogTitle>
                    <DialogDescription>
                        Keep supplier information and performance indicators
                        current.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="supplier_code"
                            label="Supplier Code"
                            error={form.errors.supplier_code}
                            required
                        >
                            <Input
                                id="supplier_code"
                                value={form.data.supplier_code}
                                onChange={(event) =>
                                    form.setData(
                                        'supplier_code',
                                        event.target.value,
                                    )
                                }
                                placeholder="SUP-000001"
                                required
                            />
                        </Field>
                        <Field
                            id="company_name"
                            label="Company Name"
                            error={form.errors.company_name}
                            required
                        >
                            <Input
                                id="company_name"
                                value={form.data.company_name}
                                onChange={(event) =>
                                    form.setData(
                                        'company_name',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            id="contact_person"
                            label="Contact Person"
                            error={form.errors.contact_person}
                        >
                            <Input
                                id="contact_person"
                                value={form.data.contact_person}
                                onChange={(event) =>
                                    form.setData(
                                        'contact_person',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            id="email_address"
                            label="Email Address"
                            error={form.errors.email_address}
                        >
                            <Input
                                id="email_address"
                                type="email"
                                value={form.data.email_address}
                                onChange={(event) =>
                                    form.setData(
                                        'email_address',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            id="phone_number"
                            label="Phone Number"
                            error={form.errors.phone_number}
                        >
                            <Input
                                id="phone_number"
                                value={form.data.phone_number}
                                onChange={(event) =>
                                    form.setData(
                                        'phone_number',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id="tax_identification_number"
                            label="Tax Identification Number"
                            error={form.errors.tax_identification_number}
                        >
                            <Input
                                id="tax_identification_number"
                                value={form.data.tax_identification_number}
                                onChange={(event) =>
                                    form.setData(
                                        'tax_identification_number',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            id="status"
                            label="Status"
                            error={form.errors.status}
                            required
                        >
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData('status', value)
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <Field
                        id="address"
                        label="Address"
                        error={form.errors.address}
                    >
                        <Textarea
                            id="address"
                            value={form.data.address}
                            onChange={(event) =>
                                form.setData('address', event.target.value)
                            }
                            rows={3}
                        />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-4">
                        <NumberField
                            id="total_orders"
                            label="Total Orders"
                            value={form.data.total_orders}
                            error={form.errors.total_orders}
                            onChange={(value) =>
                                form.setData('total_orders', value)
                            }
                        />
                        <NumberField
                            id="fulfilled_orders"
                            label="Fulfilled Orders"
                            value={form.data.fulfilled_orders}
                            error={form.errors.fulfilled_orders}
                            onChange={(value) =>
                                form.setData('fulfilled_orders', value)
                            }
                        />
                        <NumberField
                            id="late_deliveries"
                            label="Late Deliveries"
                            value={form.data.late_deliveries}
                            error={form.errors.late_deliveries}
                            onChange={(value) =>
                                form.setData('late_deliveries', value)
                            }
                        />
                        <NumberField
                            id="performance_score"
                            label="Performance Score"
                            value={form.data.performance_score}
                            error={form.errors.performance_score}
                            onChange={(value) =>
                                form.setData('performance_score', value)
                            }
                            step="0.01"
                            max="100"
                        />
                    </div>

                    <Field
                        id="last_delivery_at"
                        label="Last Delivery Date"
                        error={form.errors.last_delivery_at}
                    >
                        <Input
                            id="last_delivery_at"
                            type="date"
                            value={form.data.last_delivery_at}
                            onChange={(event) =>
                                form.setData(
                                    'last_delivery_at',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save Supplier
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function supplierFormDefaults(supplier?: Supplier): SupplierFormData {
    return {
        supplier_code: supplier?.supplier_code ?? '',
        company_name: supplier?.company_name ?? '',
        contact_person: supplier?.contact_person ?? '',
        email_address: supplier?.email_address ?? '',
        phone_number: supplier?.phone_number ?? '',
        address: supplier?.address ?? '',
        tax_identification_number: supplier?.tax_identification_number ?? '',
        status: supplier?.status ?? 'active',
        total_orders: supplier?.total_orders ?? 0,
        fulfilled_orders: supplier?.fulfilled_orders ?? 0,
        late_deliveries: supplier?.late_deliveries ?? 0,
        performance_score: supplier?.performance_score ?? '',
        last_delivery_at: supplier?.last_delivery_at
            ? supplier.last_delivery_at.slice(0, 10)
            : '',
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

function NumberField({
    id,
    label,
    value,
    error,
    onChange,
    step = '1',
    max,
}: {
    id: string;
    label: string;
    value: number | string;
    error?: string;
    onChange: (value: string) => void;
    step?: string;
    max?: string;
}) {
    return (
        <Field id={id} label={label} error={error}>
            <Input
                id={id}
                type="number"
                min="0"
                max={max}
                step={step}
                value={String(value)}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function StatusBadge({ status }: { status: string }) {
    const label = status.replace('_', ' ');

    if (status === 'active') {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {label}
            </Badge>
        );
    }

    if (status === 'blacklisted') {
        return <Badge variant="destructive">{label}</Badge>;
    }

    return <Badge variant="secondary">{label}</Badge>;
}

function formatScore(value?: number | string | null): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return `${Number(value).toFixed(2)}%`;
}
