<?php

namespace App\Services;

use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Support\Collection;

class WarehouseManagementService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function warehouses(): Collection
    {
        return Warehouse::query()
            ->with([
                'manager:id,name,email',
                'locations' => fn ($query) => $query
                    ->with(['items:id,item_code,name,unit_of_measure,warehouse_id,warehouse_location_id'])
                    ->orderBy('location_code'),
                'permittedUsers:id,name,email',
            ])
            ->withCount(['items', 'locations'])
            ->orderBy('name')
            ->get()
            ->map(fn (Warehouse $warehouse): array => [
                'id' => $warehouse->id,
                'warehouse_code' => $warehouse->warehouse_code,
                'name' => $warehouse->name,
                'type' => $warehouse->type,
                'manager_id' => $warehouse->manager_id,
                'manager' => $warehouse->manager ? [
                    'id' => $warehouse->manager->id,
                    'name' => $warehouse->manager->name,
                    'email' => $warehouse->manager->email,
                ] : null,
                'campus' => $warehouse->campus,
                'building' => $warehouse->building,
                'address' => $warehouse->address,
                'capacity' => (float) $warehouse->capacity,
                'used_capacity' => (float) $warehouse->used_capacity,
                'capacity_used_percent' => $this->percent($warehouse->used_capacity, $warehouse->capacity),
                'is_active' => $warehouse->is_active,
                'notes' => $warehouse->notes,
                'items_count' => (int) $warehouse->items_count,
                'locations_count' => (int) $warehouse->locations_count,
                'locations' => $warehouse->locations->map(fn (WarehouseLocation $location): array => [
                    'id' => $location->id,
                    'warehouse_id' => $location->warehouse_id,
                    'parent_id' => $location->parent_id,
                    'location_code' => $location->location_code,
                    'name' => $location->name,
                    'type' => $location->type,
                    'building' => $location->building,
                    'floor' => $location->floor,
                    'room' => $location->room,
                    'rack' => $location->rack,
                    'shelf' => $location->shelf,
                    'bin' => $location->bin,
                    'capacity' => (float) $location->capacity,
                    'used_capacity' => (float) $location->used_capacity,
                    'capacity_used_percent' => $this->percent($location->used_capacity, $location->capacity),
                    'is_active' => $location->is_active,
                    'notes' => $location->notes,
                    'items' => $location->items->map(fn (Item $item): array => [
                        'id' => $item->id,
                        'item_code' => $item->item_code,
                        'name' => $item->name,
                        'unit_of_measure' => $item->unit_of_measure,
                    ])->values(),
                ])->values(),
                'permissions' => $warehouse->permittedUsers->map(fn (User $user): array => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'can_view' => (bool) $user->pivot->can_view,
                    'can_receive' => (bool) $user->pivot->can_receive,
                    'can_transfer' => (bool) $user->pivot->can_transfer,
                    'can_adjust' => (bool) $user->pivot->can_adjust,
                ])->values(),
            ]);
    }

    /**
     * @return array{total: int, active: int, locations: int, capacity_used_percent: float, assigned_items: int}
     */
    public function summary(): array
    {
        $capacity = (float) Warehouse::query()->sum('capacity');
        $usedCapacity = (float) Warehouse::query()->sum('used_capacity');

        return [
            'total' => Warehouse::query()->count(),
            'active' => Warehouse::query()->active()->count(),
            'locations' => WarehouseLocation::query()->count(),
            'capacity_used_percent' => $this->percent($usedCapacity, $capacity),
            'assigned_items' => Warehouse::query()->withCount('items')->get()->sum('items_count'),
        ];
    }

    /**
     * @return Collection<int, array{id: int, name: string, email: string|null}>
     */
    public function users(): Collection
    {
        return User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }

    /**
     * @return Collection<int, array{id: int, item_code: string, name: string, unit_of_measure: string, warehouse_id: int|null, warehouse_location_id: int|null}>
     */
    public function assignableItems(): Collection
    {
        return Item::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'item_code', 'name', 'unit_of_measure', 'warehouse_id', 'warehouse_location_id'])
            ->map(fn (Item $item): array => [
                'id' => $item->id,
                'item_code' => $item->item_code,
                'name' => $item->name,
                'unit_of_measure' => $item->unit_of_measure,
                'warehouse_id' => $item->warehouse_id,
                'warehouse_location_id' => $item->warehouse_location_id,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createWarehouse(array $data): Warehouse
    {
        return Warehouse::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateWarehouse(Warehouse $warehouse, array $data): Warehouse
    {
        $warehouse->update($data);

        return $warehouse;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createLocation(array $data): WarehouseLocation
    {
        return WarehouseLocation::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateLocation(WarehouseLocation $warehouseLocation, array $data): WarehouseLocation
    {
        $warehouseLocation->update($data);

        return $warehouseLocation;
    }

    /**
     * @param  array<int, int>  $itemIds
     */
    public function assignItemsToLocation(WarehouseLocation $warehouseLocation, array $itemIds): void
    {
        Item::query()
            ->where('warehouse_location_id', $warehouseLocation->id)
            ->whereNotIn('id', $itemIds)
            ->update([
                'warehouse_id' => null,
                'warehouse_location_id' => null,
            ]);

        if ($itemIds === []) {
            return;
        }

        Item::query()
            ->whereIn('id', $itemIds)
            ->update([
                'warehouse_id' => $warehouseLocation->warehouse_id,
                'warehouse_location_id' => $warehouseLocation->id,
            ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $permissions
     */
    public function syncPermissions(Warehouse $warehouse, array $permissions): void
    {
        $warehouse->permittedUsers()->sync(
            collect($permissions)
                ->filter(fn (array $permission): bool => (bool) ($permission['can_view'] ?? false) ||
                    (bool) ($permission['can_receive'] ?? false) ||
                    (bool) ($permission['can_transfer'] ?? false) ||
                    (bool) ($permission['can_adjust'] ?? false))
                ->mapWithKeys(fn (array $permission): array => [
                    (int) $permission['user_id'] => [
                        'can_view' => (bool) ($permission['can_view'] ?? false),
                        'can_receive' => (bool) ($permission['can_receive'] ?? false),
                        'can_transfer' => (bool) ($permission['can_transfer'] ?? false),
                        'can_adjust' => (bool) ($permission['can_adjust'] ?? false),
                    ],
                ])
                ->all()
        );
    }

    private function percent(mixed $used, mixed $capacity): float
    {
        $capacity = (float) $capacity;

        return $capacity > 0 ? round(((float) $used / $capacity) * 100, 2) : 0.0;
    }
}
