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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import {
    store as storeLocation,
    update as updateLocation,
} from '@/routes/warehouse-locations';
import { update as updateLocationItems } from '@/routes/warehouse-locations/items';
import {
    store as storeWarehouse,
    update as updateWarehouse,
    index as warehousesIndex,
} from '@/routes/warehouses';
import { update as updateWarehousePermissions } from '@/routes/warehouses/permissions';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import {
    Boxes,
    Building2,
    MapPin,
    PackagePlus,
    Pencil,
    Plus,
    Save,
    ShieldCheck,
    Warehouse as WarehouseIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';

type UserOption = {
    id: number;
    name: string;
    email?: string | null;
};

type LocationRecord = {
    id: number;
    warehouse_id: number;
    parent_id?: number | null;
    location_code: string;
    name: string;
    type: string;
    building?: string | null;
    floor?: string | null;
    room?: string | null;
    rack?: string | null;
    shelf?: string | null;
    bin?: string | null;
    capacity: number;
    used_capacity: number;
    capacity_used_percent: number;
    is_active: boolean;
    notes?: string | null;
    items: ItemOption[];
};

type ItemOption = {
    id: number;
    item_code: string;
    name: string;
    unit_of_measure: string;
    warehouse_id?: number | null;
    warehouse_location_id?: number | null;
};

type WarehouseRecord = {
    id: number;
    warehouse_code: string;
    name: string;
    type: string;
    manager_id?: number | null;
    manager?: UserOption | null;
    campus?: string | null;
    building?: string | null;
    address?: string | null;
    capacity: number;
    used_capacity: number;
    capacity_used_percent: number;
    is_active: boolean;
    notes?: string | null;
    items_count: number;
    locations_count: number;
    locations: LocationRecord[];
    permissions: Array<
        UserOption & {
            user_id: number;
            can_view: boolean;
            can_receive: boolean;
            can_transfer: boolean;
            can_adjust: boolean;
        }
    >;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Warehouse Locations', href: warehousesIndex().url },
];

export default function WarehousesIndex({
    warehouses,
    summary,
    users,
    items,
    warehouseTypes,
}: {
    warehouses: WarehouseRecord[];
    summary: {
        total: number;
        active: number;
        locations: number;
        capacity_used_percent: number;
        assigned_items: number;
    };
    users: UserOption[];
    items: ItemOption[];
    warehouseTypes: string[];
}) {
    const { auth } = usePage<SharedData>().props;
    const grantedPermissions = new Set(auth.permissions ?? []);
    const canCreate = grantedPermissions.has('warehouses.create');
    const canUpdate = grantedPermissions.has('warehouses.update');
    const canSetPermissions = grantedPermissions.has('warehouses.permissions');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse / Location Management" />

            <div className="flex flex-1 flex-col gap-4 overflow-y-visible p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Warehouse / Location Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Organize storage locations, assign managers, monitor
                        capacity, and control warehouse access.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                    <SummaryCard
                        title="Warehouses"
                        value={summary.total}
                        icon={<WarehouseIcon className="size-4" />}
                    />
                    <SummaryCard
                        title="Active"
                        value={summary.active}
                        icon={<Building2 className="size-4" />}
                    />
                    <SummaryCard
                        title="Locations"
                        value={summary.locations}
                        icon={<MapPin className="size-4" />}
                    />
                    <SummaryCard
                        title="Capacity Used"
                        value={`${summary.capacity_used_percent}%`}
                        icon={<Boxes className="size-4" />}
                    />
                    <SummaryCard
                        title="Assigned Items"
                        value={summary.assigned_items}
                        icon={<Boxes className="size-4" />}
                    />
                </div>

                {canCreate && (
                    <div className="flex justify-end">
                        <ActionDialog
                            trigger={
                                <Button>
                                    <Plus className="size-4" />
                                    Create Warehouse
                                </Button>
                            }
                            title="Create Warehouse"
                            description="Register a new warehouse, building, stockroom, or department storage area."
                        >
                            <WarehouseForm
                                title="Create Warehouse"
                                action={storeWarehouse.form()}
                                users={users}
                                warehouseTypes={warehouseTypes}
                            />
                        </ActionDialog>
                    </div>
                )}

                <div className="grid gap-4">
                    {warehouses.map((warehouse) => (
                        <Card key={warehouse.id}>
                            <CardHeader className="gap-2">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {warehouse.name}
                                            <StatusBadge
                                                active={warehouse.is_active}
                                            />
                                        </CardTitle>
                                        <CardDescription>
                                            {warehouse.warehouse_code} ·{' '}
                                            {warehouse.type}
                                            {warehouse.manager
                                                ? ` · Manager: ${warehouse.manager.name}`
                                                : ''}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                        {canUpdate && (
                                            <>
                                                <ActionDialog
                                                    trigger={
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
                                                        </Button>
                                                    }
                                                    title="Edit Warehouse"
                                                    description="Update warehouse details, manager assignment, status, and capacity."
                                                >
                                                    <WarehouseForm
                                                        title="Edit Warehouse Information"
                                                        action={updateWarehouse.form(
                                                            warehouse.id,
                                                        )}
                                                        warehouse={warehouse}
                                                        users={users}
                                                        warehouseTypes={
                                                            warehouseTypes
                                                        }
                                                    />
                                                </ActionDialog>
                                                <ActionDialog
                                                    trigger={
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <MapPin className="size-4" />
                                                            Add Location
                                                        </Button>
                                                    }
                                                    title="Add Storage Location"
                                                    description="Create a physical storage location inside this warehouse."
                                                >
                                                    <LocationForm
                                                        warehouse={warehouse}
                                                    />
                                                </ActionDialog>
                                            </>
                                        )}
                                        {canSetPermissions && (
                                            <ActionDialog
                                                trigger={
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <ShieldCheck className="size-4" />
                                                        Permissions
                                                    </Button>
                                                }
                                                title="Warehouse Permissions"
                                                description="Control who can view, receive, transfer, and adjust this warehouse."
                                                className="sm:max-w-4xl"
                                            >
                                                <WarehousePermissionsForm
                                                    warehouse={warehouse}
                                                    users={users}
                                                />
                                            </ActionDialog>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {warehouse.locations_count} locations ·{' '}
                                        {warehouse.items_count} items
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Warehouse Capacity</span>
                                        <span>
                                            {warehouse.used_capacity}/
                                            {warehouse.capacity} (
                                            {warehouse.capacity_used_percent}%)
                                        </span>
                                    </div>
                                    <Progress
                                        value={warehouse.capacity_used_percent}
                                    />
                                </div>

                                <div className="grid gap-3">
                                    <h3 className="font-medium">
                                        Storage Locations
                                    </h3>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        {warehouse.locations.map((location) => (
                                            <div
                                                key={location.id}
                                                className="space-y-4 rounded-md border p-3"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium">
                                                            {
                                                                location.location_code
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                location.location_code
                                                            }{' '}
                                                            · {location.type}
                                                        </p>
                                                    </div>
                                                    <StatusBadge
                                                        active={
                                                            location.is_active
                                                        }
                                                    />
                                                </div>
                                                <LocationDetails
                                                    location={location}
                                                />
                                                <div className="mt-3 grid gap-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Capacity
                                                        </span>
                                                        <span>
                                                            {
                                                                location.used_capacity
                                                            }
                                                            /{location.capacity}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            location.capacity_used_percent
                                                        }
                                                    />
                                                </div>
                                                <LocationInventory
                                                    items={location.items}
                                                />
                                                {canUpdate && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <ActionDialog
                                                            trigger={
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    <Pencil className="size-4" />
                                                                    Edit
                                                                </Button>
                                                            }
                                                            title="Edit Storage Location"
                                                            description="Update the physical address, capacity, and active status for this location."
                                                        >
                                                            <UpdateLocationForm
                                                                location={
                                                                    location
                                                                }
                                                                warehouse={
                                                                    warehouse
                                                                }
                                                            />
                                                        </ActionDialog>
                                                        <ActionDialog
                                                            trigger={
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                >
                                                                    <PackagePlus className="size-4" />
                                                                    Assign Items
                                                                </Button>
                                                            }
                                                            title="Assign Items to Location"
                                                            description="Choose the active items stored in this location."
                                                        >
                                                            <LocationItemsForm
                                                                location={
                                                                    location
                                                                }
                                                                items={items}
                                                            />
                                                        </ActionDialog>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {warehouse.locations.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No locations yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {warehouses.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No warehouses found.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function ActionDialog({
    trigger,
    title,
    description,
    children,
    className = 'sm:max-w-5xl',
}: {
    trigger: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                className={`max-h-[90svh] overflow-y-auto ${className}`}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

function WarehouseForm({
    title,
    action,
    warehouse,
    users,
    warehouseTypes,
}: {
    title: string;
    action: ReturnType<typeof storeWarehouse.form>;
    warehouse?: WarehouseRecord;
    users: UserOption[];
    warehouseTypes: string[];
}) {
    return (
        <Form {...action}>
            {({ errors, processing }) => (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-4">
                        <Field
                            name="warehouse_code"
                            label="Warehouse Code"
                            defaultValue={warehouse?.warehouse_code}
                            error={errors.warehouse_code}
                            required
                        />
                        <Field
                            name="name"
                            label="Name"
                            defaultValue={warehouse?.name}
                            error={errors.name}
                            required
                        />
                        <SelectField
                            name="type"
                            label="Type"
                            defaultValue={warehouse?.type ?? 'warehouse'}
                            options={warehouseTypes}
                            error={errors.type}
                        />
                        <SelectField
                            name="manager_id"
                            label="Manager"
                            defaultValue={
                                warehouse?.manager_id
                                    ? String(warehouse.manager_id)
                                    : 'none'
                            }
                            options={[
                                'none',
                                ...users.map((user) => String(user.id)),
                            ]}
                            labels={{
                                none: 'No manager',
                                ...Object.fromEntries(
                                    users.map((user) => [
                                        String(user.id),
                                        user.name,
                                    ]),
                                ),
                            }}
                            error={errors.manager_id}
                        />
                        <Field
                            name="campus"
                            label="Campus"
                            defaultValue={warehouse?.campus ?? ''}
                            error={errors.campus}
                        />
                        <Field
                            name="building"
                            label="Building"
                            defaultValue={warehouse?.building ?? ''}
                            error={errors.building}
                        />
                        <Field
                            name="capacity"
                            label="Capacity"
                            type="number"
                            defaultValue={warehouse?.capacity ?? 0}
                            error={errors.capacity}
                            required
                        />
                        <Field
                            name="used_capacity"
                            label="Used Capacity"
                            type="number"
                            defaultValue={warehouse?.used_capacity ?? 0}
                            error={errors.used_capacity}
                            required
                        />
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Address</Label>
                            <Textarea
                                name="address"
                                defaultValue={warehouse?.address ?? ''}
                                rows={2}
                            />
                            {errors.address && (
                                <p className="text-sm text-destructive">
                                    {errors.address}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                name="notes"
                                defaultValue={warehouse?.notes ?? ''}
                                rows={2}
                            />
                        </div>
                        <input type="hidden" name="is_active" value="0" />
                        <Label className="flex items-center gap-2">
                            <Checkbox
                                name="is_active"
                                value="1"
                                defaultChecked={warehouse?.is_active ?? true}
                            />
                            Active
                        </Label>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="md:col-start-4"
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

function LocationForm({ warehouse }: { warehouse: WarehouseRecord }) {
    return (
        <Form {...storeLocation.form()}>
            {({ errors, processing }) => (
                <div className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
                    <input
                        type="hidden"
                        name="warehouse_id"
                        value={warehouse.id}
                    />
                    <input type="hidden" name="type" value="stockroom" />
                    <Field
                        name="location_code"
                        label="Location Code"
                        error={errors.location_code}
                        required
                    />
                    <Field
                        name="building"
                        label="Building"
                        defaultValue={warehouse.building ?? ''}
                        error={errors.building}
                    />
                    <Field name="floor" label="Floor" error={errors.floor} />
                    <Field name="room" label="Room" error={errors.room} />
                    <Field name="rack" label="Rack" error={errors.rack} />
                    <Field name="shelf" label="Shelf" error={errors.shelf} />
                    <Field name="bin" label="Bin" error={errors.bin} />
                    <Field
                        name="capacity"
                        label="Capacity"
                        type="number"
                        defaultValue={0}
                        error={errors.capacity}
                    />
                    <input type="hidden" name="used_capacity" value="0" />
                    <input type="hidden" name="is_active" value="1" />
                    <div className="flex items-end">
                        <Button type="submit" disabled={processing}>
                            Add Location
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

function UpdateLocationForm({
    warehouse,
    location,
}: {
    warehouse: WarehouseRecord;
    location: LocationRecord;
}) {
    return (
        <Form {...updateLocation.form(location.id)}>
            {({ errors, processing }) => (
                <div className="grid gap-3 rounded-md bg-muted/40 p-3 md:grid-cols-3">
                    <input
                        type="hidden"
                        name="warehouse_id"
                        value={warehouse.id}
                    />
                    <input type="hidden" name="type" value={location.type} />
                    <Field
                        name="location_code"
                        label="Location Code"
                        defaultValue={location.location_code}
                        error={errors.location_code}
                        required
                    />
                    <Field
                        name="building"
                        label="Building"
                        defaultValue={location.building ?? ''}
                        error={errors.building}
                    />
                    <Field
                        name="floor"
                        label="Floor"
                        defaultValue={location.floor ?? ''}
                        error={errors.floor}
                    />
                    <Field
                        name="room"
                        label="Room"
                        defaultValue={location.room ?? ''}
                        error={errors.room}
                    />
                    <Field
                        name="rack"
                        label="Rack"
                        defaultValue={location.rack ?? ''}
                        error={errors.rack}
                    />
                    <Field
                        name="shelf"
                        label="Shelf"
                        defaultValue={location.shelf ?? ''}
                        error={errors.shelf}
                    />
                    <Field
                        name="bin"
                        label="Bin"
                        defaultValue={location.bin ?? ''}
                        error={errors.bin}
                    />
                    <Field
                        name="capacity"
                        label="Capacity"
                        type="number"
                        defaultValue={location.capacity}
                        error={errors.capacity}
                    />
                    <Field
                        name="used_capacity"
                        label="Used"
                        type="number"
                        defaultValue={location.used_capacity}
                        error={errors.used_capacity}
                    />
                    <input type="hidden" name="is_active" value="0" />
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            name="is_active"
                            value="1"
                            defaultChecked={location.is_active}
                        />
                        Active
                    </Label>
                    <div className="flex items-end md:justify-end">
                        <Button type="submit" disabled={processing}>
                            Save Location
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

function LocationDetails({ location }: { location: LocationRecord }) {
    const fields = [
        ['Building', location.building],
        ['Floor', location.floor],
        ['Room', location.room],
        ['Rack', location.rack],
        ['Shelf', location.shelf],
        ['Bin', location.bin],
    ];

    return (
        <div className="grid gap-2 text-sm sm:grid-cols-3">
            {fields.map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/40 p-2">
                    <p className="text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || 'N/A'}</p>
                </div>
            ))}
        </div>
    );
}

function LocationInventory({ items }: { items: ItemOption[] }) {
    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">Location Inventory</h4>
            <div className="grid gap-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                    >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">
                            {item.item_code} · {item.unit_of_measure}
                        </span>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No items assigned to this location.
                    </p>
                )}
            </div>
        </div>
    );
}

function LocationItemsForm({
    location,
    items,
}: {
    location: LocationRecord;
    items: ItemOption[];
}) {
    const assignedItemIds = new Set(location.items.map((item) => item.id));

    return (
        <Form {...updateLocationItems.form(location.id)}>
            {({ processing }) => (
                <div className="space-y-3 rounded-md border p-3">
                    <h4 className="text-sm font-medium">
                        Assign Items to Location
                    </h4>
                    <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                        {items.map((item) => (
                            <Label
                                key={item.id}
                                className="flex items-start gap-2 rounded-md border p-2 text-sm"
                            >
                                <Checkbox
                                    name="item_ids[]"
                                    value={String(item.id)}
                                    defaultChecked={assignedItemIds.has(
                                        item.id,
                                    )}
                                />
                                <span className="grid gap-0.5">
                                    <span>{item.name}</span>
                                    <span className="font-normal text-muted-foreground">
                                        {item.item_code}
                                    </span>
                                </span>
                            </Label>
                        ))}
                        {items.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No active items are available.
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={processing}>
                        Save Item Assignments
                    </Button>
                </div>
            )}
        </Form>
    );
}

function WarehousePermissionsForm({
    warehouse,
    users,
}: {
    warehouse: WarehouseRecord;
    users: UserOption[];
}) {
    const current = new Map(
        warehouse.permissions.map((permission) => [
            permission.user_id,
            permission,
        ]),
    );

    return (
        <Form {...updateWarehousePermissions.form(warehouse.id)}>
            {({ processing }) => (
                <div className="space-y-3 rounded-md border p-3">
                    <h3 className="flex items-center gap-2 font-medium">
                        <ShieldCheck className="size-4" />
                        Warehouse-Specific Permissions
                    </h3>
                    <div className="grid gap-2">
                        {users.map((user, index) => {
                            const permission = current.get(user.id);

                            return (
                                <div
                                    key={user.id}
                                    className="grid gap-2 rounded-md border p-2 md:grid-cols-[1fr_repeat(4,120px)]"
                                >
                                    <input
                                        type="hidden"
                                        name={`permissions[${index}][user_id]`}
                                        value={user.id}
                                    />
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            {user.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                    {[
                                        'can_view',
                                        'can_receive',
                                        'can_transfer',
                                        'can_adjust',
                                    ].map((flag) => (
                                        <Label
                                            key={flag}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="hidden"
                                                name={`permissions[${index}][${flag}]`}
                                                value="0"
                                            />
                                            <Checkbox
                                                name={`permissions[${index}][${flag}]`}
                                                value="1"
                                                defaultChecked={Boolean(
                                                    permission?.[
                                                        flag as keyof typeof permission
                                                    ],
                                                )}
                                            />
                                            {flag.replace('can_', '')}
                                        </Label>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                    <Button type="submit" disabled={processing}>
                        Save Permissions
                    </Button>
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
    name,
    label,
    defaultValue = '',
    type = 'text',
    error,
    required = false,
}: {
    name: string;
    label: string;
    defaultValue?: string | number;
    type?: string;
    error?: string;
    required?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Input
                name={name}
                type={type}
                defaultValue={String(defaultValue)}
                required={required}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function SelectField({
    name,
    label,
    defaultValue,
    options,
    labels = {},
    error,
}: {
    name: string;
    label: string;
    defaultValue: string;
    options: string[];
    labels?: Record<string, string>;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <Select name={name} defaultValue={defaultValue}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {labels[option] ??
                                option.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
            Active
        </Badge>
    ) : (
        <Badge variant="secondary">Inactive</Badge>
    );
}
