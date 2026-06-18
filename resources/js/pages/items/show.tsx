import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { confirmArchiveItem } from '@/lib/confirm';
import { cn } from '@/lib/utils';
import { destroy, edit, index as itemsIndex } from '@/routes/items';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArrowLeft,
    BadgeDollarSign,
    Barcode,
    Boxes,
    CalendarClock,
    PencilLine,
    Tags,
} from 'lucide-react';
import type { ReactNode } from 'react';

type Item = {
    id: number;
    item_code: string;
    barcode?: string | null;
    name: string;
    description?: string | null;
    category: string;
    subcategory?: string | null;
    unit_of_measure: string;
    brand?: string | null;
    manufacturer?: string | null;
    reorder_level: number;
    maximum_stock_level: number;
    minimum_stock_level: number;
    standard_cost?: number | string | null;
    selling_price?: number | string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
};

type ShowItemProps = {
    item: Item;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Items', href: itemsIndex().url },
    { title: 'View', href: '#' },
];

export default function ShowItem({ item }: ShowItemProps) {
    async function archiveItem() {
        if (await confirmArchiveItem(item.name)) {
            router.delete(destroy(item.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={item.name} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <Link
                            href={itemsIndex().url}
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to items
                        </Link>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-semibold">
                                    {item.name}
                                </h1>
                                <StatusBadge isArchived={item.is_archived} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">
                                    {item.item_code}
                                </Badge>
                                <span>{item.category}</span>
                                <span>{item.unit_of_measure}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={edit(item.id).url}
                            className={cn(buttonVariants())}
                        >
                            <PencilLine className="size-4" />
                            Edit
                        </Link>
                        {!item.is_archived && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={archiveItem}
                            >
                                <Archive className="size-4" />
                                Archive
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="gap-2">
                                <CardTitle>Overview</CardTitle>
                                <CardDescription>
                                    Core item identity and descriptive details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <InfoTile
                                    icon={<Barcode className="size-4" />}
                                    label="Item code"
                                    value={item.item_code}
                                />
                                <InfoTile
                                    icon={<Barcode className="size-4" />}
                                    label="Barcode / QR code"
                                    value={item.barcode}
                                />
                                <InfoTile
                                    icon={<Tags className="size-4" />}
                                    label="Category"
                                    value={item.category}
                                />
                                <InfoTile
                                    icon={<Tags className="size-4" />}
                                    label="Subcategory"
                                    value={item.subcategory}
                                />
                                <InfoTile label="Brand" value={item.brand} />
                                <InfoTile
                                    label="Manufacturer"
                                    value={item.manufacturer}
                                />
                            </CardContent>
                        </Card>

                        {item.description && (
                            <Card>
                                <CardHeader className="gap-2">
                                    <CardTitle>Description</CardTitle>
                                    <CardDescription>
                                        Notes and specifications for this item.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="gap-2">
                                <CardTitle>Stock Levels</CardTitle>
                                <CardDescription>
                                    Thresholds used to guide replenishment.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <MetricTile
                                        label="Unit"
                                        value={item.unit_of_measure}
                                    />
                                    <MetricTile
                                        label="Reorder"
                                        value={item.reorder_level}
                                    />
                                    <MetricTile
                                        label="Minimum"
                                        value={item.minimum_stock_level}
                                    />
                                    <MetricTile
                                        label="Maximum"
                                        value={item.maximum_stock_level}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="gap-2">
                                <CardTitle>Pricing</CardTitle>
                                <CardDescription>
                                    Optional financial references for this
                                    master item.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <MetricTile
                                        icon={
                                            <BadgeDollarSign className="size-4" />
                                        }
                                        label="Standard cost"
                                        value={formatCurrency(
                                            item.standard_cost,
                                        )}
                                    />
                                    <MetricTile
                                        icon={
                                            <BadgeDollarSign className="size-4" />
                                        }
                                        label="Selling price"
                                        value={formatCurrency(
                                            item.selling_price,
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-4">
                        <Card>
                            <CardHeader className="gap-2">
                                <CardTitle>Record Details</CardTitle>
                                <CardDescription>
                                    Audit-friendly metadata.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoTile
                                    icon={<CalendarClock className="size-4" />}
                                    label="Created"
                                    value={formatDateTime(item.created_at)}
                                />
                                <InfoTile
                                    icon={<CalendarClock className="size-4" />}
                                    label="Last updated"
                                    value={formatDateTime(item.updated_at)}
                                />
                                <Separator />
                                <InfoTile
                                    icon={<Boxes className="size-4" />}
                                    label="Status"
                                    value={
                                        item.is_archived ? 'Archived' : 'Active'
                                    }
                                />
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function StatusBadge({ isArchived }: { isArchived: boolean }) {
    if (isArchived) {
        return (
            <Badge variant="secondary" className="text-muted-foreground">
                <Archive className="size-3.5" />
                Archived
            </Badge>
        );
    }

    return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
            Active
        </Badge>
    );
}

function InfoTile({
    icon,
    label,
    value,
}: {
    icon?: ReactNode;
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="font-medium">{value || '-'}</div>
        </div>
    );
}

function MetricTile({
    icon,
    label,
    value,
}: {
    icon?: ReactNode;
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-2 text-xl font-semibold tabular-nums">
                {value}
            </div>
        </div>
    );
}

function formatCurrency(value?: number | string | null): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
    }).format(Number(value));
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
