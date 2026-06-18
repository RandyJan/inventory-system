import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { confirmArchiveItem } from '@/lib/confirm';
import { cn } from '@/lib/utils';
import {
    create,
    destroy,
    edit,
    index as itemsIndex,
    show,
} from '@/routes/items';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    BadgeDollarSign,
    Boxes,
    Eye,
    PackagePlus,
    PencilLine,
    Search,
    Tags,
} from 'lucide-react';
import { FormEvent, type ReactNode, useMemo, useState } from 'react';

type PageLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Item = {
    id: number;
    item_code: string;
    name: string;
    category: string;
    barcode?: string | null;
    unit_of_measure: string;
    standard_cost?: number | string | null;
    selling_price?: number | string | null;
    reorder_level: number;
    minimum_stock_level: number;
    is_archived: boolean;
    created_at: string;
};

type PaginatedItems = {
    data: Item[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PageLink[];
};

type ItemsIndexProps = {
    items: PaginatedItems;
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        show_archived?: boolean;
        per_page?: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Items', href: itemsIndex().url },
];

export default function ItemsIndex({
    items,
    categories,
    filters,
}: ItemsIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || 'all',
    );
    const [status, setStatus] = useState(
        filters.show_archived ? 'archived' : 'active',
    );

    const summary = useMemo(() => {
        const visibleItems = items.data ?? [];
        const activeCount = visibleItems.filter(
            (item) => !item.is_archived,
        ).length;
        const archivedCount = visibleItems.length - activeCount;
        const pricedCount = visibleItems.filter(
            (item) =>
                item.selling_price !== null && item.selling_price !== undefined,
        ).length;

        return {
            activeCount,
            archivedCount,
            pricedCount,
        };
    }, [items.data]);

    function submitFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            itemsIndex().url,
            {
                search: search || undefined,
                category:
                    selectedCategory === 'all' ? undefined : selectedCategory,
                show_archived: status === 'archived' ? true : undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    async function archiveItem(item: Item) {
        if (await confirmArchiveItem(item.name)) {
            router.delete(destroy(item.id).url, {
                preserveScroll: true,
            });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Items" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Items</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage inventory master data, stock thresholds, and
                            pricing references.
                        </p>
                    </div>

                    <Link href={create().url} className={cn(buttonVariants())}>
                        <PackagePlus className="size-4" />
                        Create Item
                    </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <SummaryCard
                        title="Active"
                        value={summary.activeCount}
                        description="Shown in current results"
                        icon={<Boxes className="size-4" />}
                    />
                    <SummaryCard
                        title="Categories"
                        value={categories.length}
                        description="Available classifications"
                        icon={<Tags className="size-4" />}
                    />
                    <SummaryCard
                        title="Priced"
                        value={summary.pricedCount}
                        description={
                            summary.archivedCount > 0
                                ? `${summary.archivedCount} archived in view`
                                : 'With selling price set'
                        }
                        icon={<BadgeDollarSign className="size-4" />}
                    />
                </div>

                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Find Items</CardTitle>
                        <CardDescription>
                            Search by item code, name, barcode, or category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px_auto]"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="item-search">Search</Label>
                                <Input
                                    id="item-search"
                                    name="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Code, name, or barcode"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All categories
                                        </SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="archived">
                                            Archived
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="lg:self-end">
                                <Search className="size-4" />
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>UoM</TableHead>
                                <TableHead className="text-right">
                                    Cost
                                </TableHead>
                                <TableHead className="text-right">
                                    Price
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.data.length > 0 ? (
                                items.data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="min-w-56 space-y-1">
                                                <Link
                                                    href={show(item.id).url}
                                                    className="font-medium hover:underline"
                                                >
                                                    {item.name}
                                                </Link>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                    <span>
                                                        {item.item_code}
                                                    </span>
                                                    {item.barcode && (
                                                        <span className="truncate">
                                                            {item.barcode}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.unit_of_measure}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground tabular-nums">
                                            {formatCurrency(item.standard_cost)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium tabular-nums">
                                            {formatCurrency(item.selling_price)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge item={item} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={show(item.id).url}
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'icon',
                                                        }),
                                                    )}
                                                    title="View item"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit(item.id).url}
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: 'ghost',
                                                            size: 'icon',
                                                        }),
                                                    )}
                                                    title="Edit item"
                                                >
                                                    <PencilLine className="size-4" />
                                                </Link>
                                                {!item.is_archived && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            archiveItem(item)
                                                        }
                                                        title="Archive item"
                                                    >
                                                        <Archive className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="h-32 text-center"
                                    >
                                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                                            <Boxes className="size-8" />
                                            <p className="font-medium text-foreground">
                                                No items found
                                            </p>
                                            <p className="text-sm">
                                                Adjust your filters or create a
                                                new item record.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {items.from ?? 0} to {items.to ?? 0} of{' '}
                        {items.total}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {items.links.map((link, index) =>
                            link.url ? (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={cn(
                                        buttonVariants({
                                            variant: link.active
                                                ? 'default'
                                                : 'outline',
                                            size: 'sm',
                                        }),
                                    )}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className={cn(
                                        buttonVariants({
                                            variant: 'outline',
                                            size: 'sm',
                                        }),
                                        'pointer-events-none opacity-50',
                                    )}
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

function SummaryCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number;
    description: string;
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
            <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                {description}
            </CardContent>
        </Card>
    );
}

function StatusBadge({ item }: { item: Item }) {
    if (item.is_archived) {
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

function formatCurrency(value?: number | string | null): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
    }).format(Number(value));
}
