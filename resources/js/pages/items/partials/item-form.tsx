import {
    BarcodeQrPreview,
    generateInventoryCode,
} from '@/components/inventory-code-tools';
import { Button, buttonVariants } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { index as itemsIndex } from '@/routes/items';
import type { RouteFormDefinition } from '@/wayfinder';
import { Form, Link } from '@inertiajs/react';
import {
    Archive,
    Barcode,
    Boxes,
    DollarSign,
    Info,
    QrCode,
    Save,
    Tags,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

export type ItemFormRecord = {
    id: number;
    item_code: string;
    barcode?: string | null;
    name: string;
    description?: string | null;
    category: string;
    subcategory?: string | null;
    category_id?: number | null;
    subcategory_id?: number | null;
    unit_of_measure: string;
    brand?: string | null;
    manufacturer?: string | null;
    reorder_level: number;
    maximum_stock_level: number;
    minimum_stock_level: number;
    standard_cost?: number | string | null;
    selling_price?: number | string | null;
    is_archived: boolean;
};

type ItemFormProps = {
    action: RouteFormDefinition<'post'>;
    categories: InventoryCategoryOption[];
    item?: ItemFormRecord;
    submitLabel: string;
    description: string;
    showArchiveControl?: boolean;
};

type InventoryCategoryOption = {
    id: number;
    name: string;
    subcategories: {
        id: number;
        name: string;
    }[];
};

const unitOfMeasures = [
    'PCS',
    'BOX',
    'PACK',
    'REAM',
    'CASE',
    'BUNDLE',
    'ROLL',
    'KG',
    'LB',
    'L',
    'ML',
    'M',
    'CM',
];

export function ItemForm({
    action,
    categories,
    item,
    submitLabel,
    description,
    showArchiveControl = false,
}: ItemFormProps) {
    const initialCategoryId = item?.category_id
        ? String(item.category_id)
        : categories[0]?.id
          ? String(categories[0].id)
          : '';
    const [selectedCategoryId, setSelectedCategoryId] =
        useState(initialCategoryId);
    const selectedCategory = useMemo(
        () =>
            categories.find(
                (category) => String(category.id) === selectedCategoryId,
            ),
        [categories, selectedCategoryId],
    );
    const initialSubcategoryId =
        item?.subcategory_id &&
        selectedCategory?.subcategories.some(
            (subcategory) => subcategory.id === item.subcategory_id,
        )
            ? String(item.subcategory_id)
            : '';
    const [selectedSubcategoryId, setSelectedSubcategoryId] =
        useState(initialSubcategoryId);
    const [itemCode, setItemCode] = useState(item?.item_code ?? '');
    const [barcode, setBarcode] = useState(item?.barcode ?? '');
    const codePreviewValue = barcode || itemCode;

    return (
        <Form {...action}>
            {({ errors, processing }) => (
                <Card>
                    <CardHeader className="gap-2">
                        <CardTitle>Item Information</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <FormSection
                            icon={<Info className="size-4" />}
                            title="Basic information"
                            description="Identifiers and descriptive details used across inventory workflows."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    id="item_code"
                                    label="Item code"
                                    error={errors.item_code}
                                    required
                                >
                                    <Input
                                        id="item_code"
                                        name="item_code"
                                        value={itemCode}
                                        onChange={(event) =>
                                            setItemCode(event.target.value)
                                        }
                                        placeholder="SKU-001"
                                        required
                                    />
                                </Field>
                                <Field
                                    id="barcode"
                                    label="Barcode / QR code"
                                    error={errors.barcode}
                                >
                                    <Input
                                        id="barcode"
                                        name="barcode"
                                        value={barcode}
                                        onChange={(event) =>
                                            setBarcode(event.target.value)
                                        }
                                        placeholder="1234567890123"
                                    />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setBarcode(generateInventoryCode())
                                        }
                                    >
                                        <Barcode className="size-4" />
                                        Generate barcode
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const generatedCode =
                                                generateInventoryCode('QR');

                                            setBarcode(generatedCode);

                                            if (!itemCode) {
                                                setItemCode(generatedCode);
                                            }
                                        }}
                                    >
                                        <QrCode className="size-4" />
                                        Generate QR code
                                    </Button>
                                </div>
                                <BarcodeQrPreview value={codePreviewValue} />
                            </div>

                            <Field
                                id="name"
                                label="Item name"
                                error={errors.name}
                                required
                            >
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={item?.name ?? ''}
                                    placeholder="Office Chair"
                                    required
                                />
                            </Field>

                            <Field
                                id="description"
                                label="Description"
                                error={errors.description}
                            >
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={item?.description ?? ''}
                                    placeholder="Notes, specifications, or procurement details"
                                    rows={4}
                                />
                            </Field>
                        </FormSection>

                        <FormSection
                            icon={<Tags className="size-4" />}
                            title="Classification"
                            description="Group this item for searching, reporting, and purchasing."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    id="category"
                                    label="Category"
                                    error={
                                        errors.category_id ?? errors.category
                                    }
                                    required
                                >
                                    <Select
                                        name="category_id"
                                        value={selectedCategoryId}
                                        onValueChange={(value) => {
                                            setSelectedCategoryId(value);
                                            setSelectedSubcategoryId('');
                                        }}
                                        required
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={String(category.id)}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field
                                    id="subcategory"
                                    label="Subcategory"
                                    error={
                                        errors.subcategory_id ??
                                        errors.subcategory
                                    }
                                >
                                    <Select
                                        name="subcategory_id"
                                        value={selectedSubcategoryId}
                                        onValueChange={setSelectedSubcategoryId}
                                        disabled={
                                            !selectedCategory ||
                                            selectedCategory.subcategories
                                                .length === 0
                                        }
                                    >
                                        <SelectTrigger id="subcategory">
                                            <SelectValue placeholder="No subcategory" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedCategory?.subcategories.map(
                                                (subcategory) => (
                                                    <SelectItem
                                                        key={subcategory.id}
                                                        value={String(
                                                            subcategory.id,
                                                        )}
                                                    >
                                                        {subcategory.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    id="brand"
                                    label="Brand"
                                    error={errors.brand}
                                >
                                    <Input
                                        id="brand"
                                        name="brand"
                                        defaultValue={item?.brand ?? ''}
                                        placeholder="Herman Miller"
                                    />
                                </Field>
                                <Field
                                    id="manufacturer"
                                    label="Manufacturer"
                                    error={errors.manufacturer}
                                >
                                    <Input
                                        id="manufacturer"
                                        name="manufacturer"
                                        defaultValue={item?.manufacturer ?? ''}
                                        placeholder="ABC Manufacturing"
                                    />
                                </Field>
                            </div>
                        </FormSection>

                        <FormSection
                            icon={<Boxes className="size-4" />}
                            title="Stock levels"
                            description="Set the unit and thresholds used for replenishment decisions."
                        >
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field
                                    id="unit_of_measure"
                                    label="Unit of measure"
                                    error={errors.unit_of_measure}
                                    required
                                >
                                    <Select
                                        name="unit_of_measure"
                                        defaultValue={
                                            item?.unit_of_measure ?? 'PCS'
                                        }
                                        required
                                    >
                                        <SelectTrigger id="unit_of_measure">
                                            <SelectValue placeholder="Select UoM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {unitOfMeasures.map((unit) => (
                                                <SelectItem
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <NumberField
                                    id="reorder_level"
                                    label="Reorder level"
                                    defaultValue={item?.reorder_level ?? 0}
                                    error={errors.reorder_level}
                                    required
                                />
                                <NumberField
                                    id="minimum_stock_level"
                                    label="Minimum stock"
                                    defaultValue={
                                        item?.minimum_stock_level ?? 0
                                    }
                                    error={errors.minimum_stock_level}
                                    required
                                />
                            </div>

                            <NumberField
                                id="maximum_stock_level"
                                label="Maximum stock"
                                defaultValue={item?.maximum_stock_level ?? 0}
                                error={errors.maximum_stock_level}
                                required
                            />
                        </FormSection>

                        <FormSection
                            icon={<DollarSign className="size-4" />}
                            title="Pricing"
                            description="Optional cost and selling price references."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <NumberField
                                    id="standard_cost"
                                    label="Standard cost"
                                    defaultValue={item?.standard_cost ?? ''}
                                    error={errors.standard_cost}
                                    placeholder="0.00"
                                />
                                <NumberField
                                    id="selling_price"
                                    label="Selling price"
                                    defaultValue={item?.selling_price ?? ''}
                                    error={errors.selling_price}
                                    placeholder="0.00"
                                />
                            </div>
                        </FormSection>

                        {showArchiveControl && (
                            <FormSection
                                icon={<Archive className="size-4" />}
                                title="Status"
                                description="Archived items stay searchable but are removed from active workflows."
                            >
                                <input
                                    type="hidden"
                                    name="is_archived"
                                    value="0"
                                />
                                <Label
                                    htmlFor="is_archived"
                                    className="flex items-center gap-3 rounded-md border p-3"
                                >
                                    <Checkbox
                                        id="is_archived"
                                        name="is_archived"
                                        value="1"
                                        defaultChecked={item?.is_archived}
                                    />
                                    <span className="grid gap-1">
                                        <span>Archive this item</span>
                                        <span className="text-sm font-normal text-muted-foreground">
                                            Hide it from active item lists while
                                            preserving its record.
                                        </span>
                                    </span>
                                </Label>
                            </FormSection>
                        )}

                        <Separator />

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Link
                                href={itemsIndex().url}
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                )}
                            >
                                Cancel
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="size-4" />
                                {processing ? 'Saving...' : submitLabel}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </Form>
    );
}

function FormSection({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium">
                    <span className="flex size-8 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        {icon}
                    </span>
                    {title}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="space-y-4">{children}</div>
        </section>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function NumberField({
    id,
    label,
    defaultValue,
    error,
    required = false,
    placeholder,
}: {
    id: string;
    label: string;
    defaultValue: number | string;
    error?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <Field id={id} label={label} error={error} required={required}>
            <Input
                id={id}
                name={id}
                type="number"
                step="0.01"
                defaultValue={String(defaultValue)}
                placeholder={placeholder}
                required={required}
            />
        </Field>
    );
}
