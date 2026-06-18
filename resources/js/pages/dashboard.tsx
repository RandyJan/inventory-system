import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as categoriesIndex } from '@/routes/inventory-categories';
import { index as itemsIndex } from '@/routes/items';
import { index as suppliersIndex } from '@/routes/suppliers';
import { index as warehousesIndex } from '@/routes/warehouses';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    Building2,
    CircleCheck,
    PackageCheck,
    PackageSearch,
    Tags,
    Truck,
    Warehouse,
} from 'lucide-react';
import { type ReactNode } from 'react';

type Analytics = {
    summary: {
        total_items: number;
        active_items: number;
        archived_items: number;
        assigned_items: number;
        unassigned_items: number;
        assignment_rate: number;
        warehouses: number;
        active_warehouses: number;
        storage_locations: number;
        active_locations: number;
        suppliers: number;
        active_suppliers: number;
        average_supplier_score: number;
    };
    capacity: {
        warehouse_used: number;
        warehouse_total: number;
        warehouse_used_percent: number;
        location_used: number;
        location_total: number;
        location_used_percent: number;
    };
    inventory_health: {
        with_category: number;
        without_category: number;
        with_location: number;
        without_location: number;
        with_cost: number;
        without_cost: number;
    };
    category_mix: CategoryMetric[];
    warehouse_utilization: WarehouseMetric[];
    supplier_performance: SupplierMetric[];
    recent_items: RecentItem[];
    alerts: AlertMetric[];
};

type CategoryMetric = {
    name: string;
    items_count: number;
    active: boolean;
};

type WarehouseMetric = {
    name: string;
    code: string;
    items_count: number;
    locations_count: number;
    used_percent: number;
    active: boolean;
};

type SupplierMetric = {
    name: string;
    code: string;
    status: string;
    score: number;
    fulfillment_rate: number;
    late_deliveries: number;
};

type RecentItem = {
    name: string;
    code: string;
    category?: string | null;
    location: string;
    created_at?: string | null;
};

type AlertMetric = {
    label: string;
    value: string;
    tone: 'good' | 'warning' | 'critical' | string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ analytics }: { analytics: Analytics }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Inventory Analytics
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Operational view of inventory readiness, storage
                            capacity, supplier health, and recent item activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <QuickLink href={itemsIndex().url}>Items</QuickLink>
                        <QuickLink href={warehousesIndex().url}>
                            Warehouses
                        </QuickLink>
                        <QuickLink href={suppliersIndex().url}>
                            Suppliers
                        </QuickLink>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title="Active Items"
                        value={analytics.summary.active_items}
                        description={`${analytics.summary.archived_items} archived`}
                        icon={<Boxes className="size-4" />}
                    />
                    <MetricCard
                        title="Location Assignment"
                        value={`${analytics.summary.assignment_rate}%`}
                        description={`${analytics.summary.unassigned_items} active items unassigned`}
                        icon={<PackageCheck className="size-4" />}
                    />
                    <MetricCard
                        title="Warehouses"
                        value={analytics.summary.warehouses}
                        description={`${analytics.summary.active_warehouses} active · ${analytics.summary.storage_locations} locations`}
                        icon={<Warehouse className="size-4" />}
                    />
                    <MetricCard
                        title="Supplier Score"
                        value={analytics.summary.average_supplier_score}
                        description={`${analytics.summary.active_suppliers} active suppliers`}
                        icon={<Truck className="size-4" />}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Capacity Utilization</CardTitle>
                            <CardDescription>
                                Monitor storage pressure across warehouses and
                                storage locations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <CapacityBar
                                label="Warehouse capacity"
                                used={analytics.capacity.warehouse_used}
                                total={analytics.capacity.warehouse_total}
                                percent={
                                    analytics.capacity.warehouse_used_percent
                                }
                            />
                            <CapacityBar
                                label="Location capacity"
                                used={analytics.capacity.location_used}
                                total={analytics.capacity.location_total}
                                percent={
                                    analytics.capacity.location_used_percent
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Health</CardTitle>
                            <CardDescription>
                                Data completeness signals for active items.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <HealthRow
                                label="Categorized"
                                good={analytics.inventory_health.with_category}
                                attention={
                                    analytics.inventory_health.without_category
                                }
                            />
                            <HealthRow
                                label="Located"
                                good={analytics.inventory_health.with_location}
                                attention={
                                    analytics.inventory_health.without_location
                                }
                            />
                            <HealthRow
                                label="Costed"
                                good={analytics.inventory_health.with_cost}
                                attention={analytics.inventory_health.without_cost}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card className="xl:col-span-2">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Warehouse Utilization</CardTitle>
                                <CardDescription>
                                    Highest used warehouses by declared
                                    capacity.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={warehousesIndex().url}>
                                    View Warehouses
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analytics.warehouse_utilization.map(
                                (warehouse) => (
                                    <RankedBar
                                        key={warehouse.code}
                                        label={warehouse.name}
                                        detail={`${warehouse.code} · ${warehouse.locations_count} locations · ${warehouse.items_count} items`}
                                        percent={warehouse.used_percent}
                                        inactive={!warehouse.active}
                                    />
                                ),
                            )}
                            {analytics.warehouse_utilization.length === 0 && (
                                <EmptyState>No warehouses yet.</EmptyState>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alerts</CardTitle>
                            <CardDescription>
                                Items that need operational attention.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analytics.alerts.map((alert) => (
                                <div
                                    key={alert.label}
                                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        {alert.tone === 'good' ? (
                                            <CircleCheck className="size-4 text-emerald-600" />
                                        ) : (
                                            <AlertTriangle className="size-4 text-amber-600" />
                                        )}
                                        <span className="text-sm">
                                            {alert.label}
                                        </span>
                                    </div>
                                    <AlertBadge tone={alert.tone}>
                                        {alert.value}
                                    </AlertBadge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Top Categories</CardTitle>
                                <CardDescription>
                                    Item distribution by category.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={categoriesIndex().url}>
                                    Categories
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analytics.category_mix.map((category) => (
                                <div
                                    key={category.name}
                                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <Tags className="size-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {category.name}
                                        </span>
                                    </div>
                                    <Badge variant="secondary">
                                        {category.items_count}
                                    </Badge>
                                </div>
                            ))}
                            {analytics.category_mix.length === 0 && (
                                <EmptyState>No categories yet.</EmptyState>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Supplier Performance</CardTitle>
                                <CardDescription>
                                    Best suppliers by performance score.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={suppliersIndex().url}>
                                    Suppliers
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analytics.supplier_performance.map((supplier) => (
                                <div
                                    key={supplier.code}
                                    className="rounded-md border p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {supplier.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {supplier.code} ·{' '}
                                                {supplier.status}
                                            </p>
                                        </div>
                                        <Badge>{supplier.score}</Badge>
                                    </div>
                                    <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Fulfillment</span>
                                            <span>
                                                {supplier.fulfillment_rate}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={supplier.fulfillment_rate}
                                        />
                                    </div>
                                </div>
                            ))}
                            {analytics.supplier_performance.length === 0 && (
                                <EmptyState>No suppliers yet.</EmptyState>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Recent Items</CardTitle>
                                <CardDescription>
                                    Latest item records added to inventory.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={itemsIndex().url}>Items</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analytics.recent_items.map((item) => (
                                <div
                                    key={item.code}
                                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.code} ·{' '}
                                            {item.category ?? 'Uncategorized'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.location}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.created_at}
                                    </span>
                                </div>
                            ))}
                            {analytics.recent_items.length === 0 && (
                                <EmptyState>No item activity yet.</EmptyState>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number | string;
    description: string;
    icon: ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="space-y-0 pb-2">
                <CardDescription className="flex items-center gap-2">
                    {icon}
                    {title}
                </CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function QuickLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Button asChild variant="outline" size="sm">
            <Link href={href}>{children}</Link>
        </Button>
    );
}

function CapacityBar({
    label,
    used,
    total,
    percent,
}: {
    label: string;
    used: number;
    total: number;
    percent: number;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                    {used}/{total} · {percent}%
                </span>
            </div>
            <Progress value={percent} />
        </div>
    );
}

function HealthRow({
    label,
    good,
    attention,
}: {
    label: string;
    good: number;
    attention: number;
}) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex items-center gap-2">
                <PackageSearch className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">{label}</p>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                    <p className="text-2xl font-semibold">{good}</p>
                    <p className="text-xs text-muted-foreground">ready</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-semibold text-amber-600">
                        {attention}
                    </p>
                    <p className="text-xs text-muted-foreground">attention</p>
                </div>
            </div>
        </div>
    );
}

function RankedBar({
    label,
    detail,
    percent,
    inactive,
}: {
    label: string;
    detail: string;
    percent: number;
    inactive: boolean;
}) {
    return (
        <div className="rounded-md border p-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                </div>
                <Badge variant={inactive ? 'secondary' : 'default'}>
                    {percent}%
                </Badge>
            </div>
            <Progress value={percent} className="mt-3" />
        </div>
    );
}

function AlertBadge({
    tone,
    children,
}: {
    tone: string;
    children: ReactNode;
}) {
    if (tone === 'good') {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {children}
            </Badge>
        );
    }

    if (tone === 'critical') {
        return <Badge variant="destructive">{children}</Badge>;
    }

    return <Badge variant="secondary">{children}</Badge>;
}

function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            {children}
        </div>
    );
}
