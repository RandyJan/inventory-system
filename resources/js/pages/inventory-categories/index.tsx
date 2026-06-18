import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    index as categoriesIndex,
    store,
    update,
} from '@/routes/inventory-categories';
import { BreadcrumbItem } from '@/types';
import { type SharedData } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { BarChart3, Boxes, FolderTree, Save, Tags } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';

type CategoryReport = {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    items_count: number;
    active_inventory_value: number;
    subcategories: SubcategoryReport[];
};

type SubcategoryReport = {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    items_count: number;
    parent_id: number;
};

type CategoryOption = {
    id: number;
    name: string;
};

type InventoryCategoriesIndexProps = {
    categories: CategoryReport[];
    categoryOptions: CategoryOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Categories', href: categoriesIndex().url },
];

export default function InventoryCategoriesIndex({
    categories,
    categoryOptions,
}: InventoryCategoriesIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const permissions = new Set(auth.permissions ?? []);
    const canCreateCategories = permissions.has('inventory-categories.create');
    const canUpdateCategories = permissions.has('inventory-categories.update');
    const summary = useMemo(
        () => ({
            categories: categories.length,
            subcategories: categories.reduce(
                (total, category) => total + category.subcategories.length,
                0,
            ),
            assignedItems: categories.reduce(
                (total, category) => total + category.items_count,
                0,
            ),
            activeInventoryValue: categories.reduce(
                (total, category) => total + category.active_inventory_value,
                0,
            ),
        }),
        [categories],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Categories" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">
                        Inventory Categories
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create categories, manage subcategories, and review item
                        assignment coverage.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <SummaryCard
                        title="Categories"
                        value={summary.categories}
                        icon={<Tags className="size-4" />}
                    />
                    <SummaryCard
                        title="Subcategories"
                        value={summary.subcategories}
                        icon={<FolderTree className="size-4" />}
                    />
                    <SummaryCard
                        title="Assigned items"
                        value={summary.assignedItems}
                        icon={<Boxes className="size-4" />}
                    />
                    <SummaryCard
                        title="Active value"
                        value={formatCurrency(summary.activeInventoryValue)}
                        icon={<BarChart3 className="size-4" />}
                    />
                </div>

                <div
                    className={
                        canCreateCategories
                            ? 'grid gap-4 xl:grid-cols-[380px_1fr]'
                            : 'grid gap-4'
                    }
                >
                    {canCreateCategories && (
                        <div className="space-y-4">
                            <CategoryForm
                                title="Create Category"
                                description="Add a top-level inventory category."
                                action={store.form()}
                            />
                            <CategoryForm
                                title="Create Subcategory"
                                description="Add a child classification below a category."
                                action={store.form()}
                                categoryOptions={categoryOptions}
                            />
                        </div>
                    )}

                    <Card>
                        <CardHeader className="gap-2">
                            <CardTitle>Category Reporting</CardTitle>
                            <CardDescription>
                                Counts reflect items assigned through category
                                management.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">
                                                Items
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Value
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.length > 0 ? (
                                            categories.map((category) => (
                                                <CategoryRows
                                                    key={category.id}
                                                    category={category}
                                                    canUpdate={
                                                        canUpdateCategories
                                                    }
                                                />
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="h-32 text-center text-muted-foreground"
                                                >
                                                    No categories yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function CategoryRows({
    category,
    canUpdate,
}: {
    category: CategoryReport;
    canUpdate: boolean;
}) {
    return (
        <>
            <TableRow>
                <TableCell>
                    {canUpdate ? (
                        <InlineCategoryForm category={category} />
                    ) : (
                        <CategoryName category={category} />
                    )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {category.items_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                    {formatCurrency(category.active_inventory_value)}
                </TableCell>
                <TableCell>
                    <StatusBadge isActive={category.is_active} />
                </TableCell>
            </TableRow>
            {category.subcategories.map((subcategory) => (
                <TableRow key={subcategory.id} className="bg-muted/30">
                    <TableCell className="pl-8">
                        {canUpdate ? (
                            <InlineCategoryForm category={subcategory} />
                        ) : (
                            <CategoryName category={subcategory} />
                        )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                        {subcategory.items_count}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                        -
                    </TableCell>
                    <TableCell>
                        <StatusBadge isActive={subcategory.is_active} />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

function CategoryName({
    category,
}: {
    category: CategoryReport | SubcategoryReport;
}) {
    return (
        <div className="space-y-1">
            <p className="font-medium">{category.name}</p>
            {category.description && (
                <p className="text-sm text-muted-foreground">
                    {category.description}
                </p>
            )}
        </div>
    );
}

function CategoryForm({
    title,
    description,
    action,
    categoryOptions,
}: {
    title: string;
    description: string;
    action: ReturnType<typeof store.form>;
    categoryOptions?: CategoryOption[];
}) {
    const parentCategory = categoryOptions?.[0];

    return (
        <Form {...action} resetOnSuccess>
            {({ errors, processing }) => (
                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryOptions && (
                            <div className="grid gap-2">
                                <Label htmlFor="parent_id">
                                    Parent category
                                </Label>
                                <select
                                    id="parent_id"
                                    name="parent_id"
                                    defaultValue={parentCategory?.id ?? ''}
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                    required
                                >
                                    {categoryOptions.map((category) => (
                                        <option
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.parent_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.parent_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <Field id="name" label="Name" error={errors.name}>
                            <Input id="name" name="name" required />
                        </Field>

                        <Field
                            id="description"
                            label="Description"
                            error={errors.description}
                        >
                            <Textarea
                                id="description"
                                name="description"
                                rows={3}
                            />
                        </Field>

                        <input type="hidden" name="is_active" value="1" />

                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                (categoryOptions !== undefined &&
                                    categoryOptions.length === 0)
                            }
                            className="w-full"
                        >
                            <Save className="size-4" />
                            Save
                        </Button>
                    </CardContent>
                </Card>
            )}
        </Form>
    );
}

function InlineCategoryForm({
    category,
}: {
    category: CategoryReport | SubcategoryReport;
}) {
    return (
        <Form {...update.form(category.id)}>
            {({ errors, processing }) => (
                <div className="grid gap-2">
                    <input
                        type="hidden"
                        name="parent_id"
                        value={'parent_id' in category ? category.parent_id : ''}
                    />
                    <div className="flex flex-col gap-2 lg:flex-row">
                        <Input
                            name="name"
                            defaultValue={category.name}
                            aria-label="Category name"
                            className="min-w-44"
                            required
                        />
                        <Input
                            name="description"
                            defaultValue={category.description ?? ''}
                            aria-label="Category description"
                            placeholder="Description"
                        />
                        <input type="hidden" name="is_active" value="0" />
                        <Label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                            <Checkbox
                                name="is_active"
                                value="1"
                                defaultChecked={category.is_active}
                            />
                            Active
                        </Label>
                        <Button type="submit" disabled={processing} size="sm">
                            Save
                        </Button>
                    </div>
                    {(errors.name ||
                        errors.description ||
                        errors.parent_id ||
                        errors.is_active) && (
                        <p className="text-sm text-destructive">
                            {errors.name ??
                                errors.description ??
                                errors.parent_id ??
                                errors.is_active}
                        </p>
                    )}
                </div>
            )}
        </Form>
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
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return isActive ? (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
            Active
        </Badge>
    ) : (
        <Badge variant="secondary">Inactive</Badge>
    );
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}
