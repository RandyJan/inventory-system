<?php

namespace App\Services;

use App\Models\InventoryCategory;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Support\Collection;

class DashboardAnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function analytics(): array
    {
        $totalItems = Item::query()->count();
        $activeItems = Item::query()->active()->count();
        $archivedItems = Item::query()->archived()->count();
        $assignedItems = Item::query()->whereNotNull('warehouse_location_id')->count();
        $unassignedItems = max($activeItems - $assignedItems, 0);

        $warehouseCapacity = (float) Warehouse::query()->sum('capacity');
        $warehouseUsedCapacity = (float) Warehouse::query()->sum('used_capacity');
        $locationCapacity = (float) WarehouseLocation::query()->sum('capacity');
        $locationUsedCapacity = (float) WarehouseLocation::query()->sum('used_capacity');

        return [
            'summary' => [
                'total_items' => $totalItems,
                'active_items' => $activeItems,
                'archived_items' => $archivedItems,
                'assigned_items' => $assignedItems,
                'unassigned_items' => $unassignedItems,
                'assignment_rate' => $this->percent($assignedItems, max($activeItems, 1)),
                'warehouses' => Warehouse::query()->count(),
                'active_warehouses' => Warehouse::query()->active()->count(),
                'storage_locations' => WarehouseLocation::query()->count(),
                'active_locations' => WarehouseLocation::query()->where('is_active', true)->count(),
                'suppliers' => Supplier::query()->count(),
                'active_suppliers' => Supplier::query()->where('status', Supplier::STATUS_ACTIVE)->count(),
                'average_supplier_score' => round((float) Supplier::query()->avg('performance_score'), 2),
            ],
            'capacity' => [
                'warehouse_used' => $warehouseUsedCapacity,
                'warehouse_total' => $warehouseCapacity,
                'warehouse_used_percent' => $this->percent($warehouseUsedCapacity, $warehouseCapacity),
                'location_used' => $locationUsedCapacity,
                'location_total' => $locationCapacity,
                'location_used_percent' => $this->percent($locationUsedCapacity, $locationCapacity),
            ],
            'inventory_health' => [
                'with_category' => Item::query()->active()->whereNotNull('category_id')->count(),
                'without_category' => Item::query()->active()->whereNull('category_id')->count(),
                'with_location' => $assignedItems,
                'without_location' => $unassignedItems,
                'with_cost' => Item::query()->active()->whereNotNull('standard_cost')->count(),
                'without_cost' => Item::query()->active()->whereNull('standard_cost')->count(),
            ],
            'category_mix' => $this->topCategories(),
            'warehouse_utilization' => $this->warehouseUtilization(),
            'supplier_performance' => $this->supplierPerformance(),
            'recent_items' => $this->recentItems(),
            'alerts' => $this->alerts($unassignedItems, $warehouseCapacity, $warehouseUsedCapacity),
        ];
    }

    /**
     * @return Collection<int, array{name: string, items_count: int, active: bool}>
     */
    private function topCategories(): Collection
    {
        return InventoryCategory::query()
            ->root()
            ->withCount('items')
            ->orderByDesc('items_count')
            ->limit(6)
            ->get(['id', 'name', 'is_active'])
            ->map(fn (InventoryCategory $category): array => [
                'name' => $category->name,
                'items_count' => (int) $category->items_count,
                'active' => $category->is_active,
            ]);
    }

    /**
     * @return Collection<int, array{name: string, code: string, items_count: int, locations_count: int, used_percent: float, active: bool}>
     */
    private function warehouseUtilization(): Collection
    {
        return Warehouse::query()
            ->withCount(['items', 'locations'])
            ->orderByDesc('used_capacity')
            ->limit(5)
            ->get(['id', 'warehouse_code', 'name', 'capacity', 'used_capacity', 'is_active'])
            ->map(fn (Warehouse $warehouse): array => [
                'name' => $warehouse->name,
                'code' => $warehouse->warehouse_code,
                'items_count' => (int) $warehouse->items_count,
                'locations_count' => (int) $warehouse->locations_count,
                'used_percent' => $this->percent($warehouse->used_capacity, $warehouse->capacity),
                'active' => $warehouse->is_active,
            ]);
    }

    /**
     * @return Collection<int, array{name: string, code: string, status: string, score: float, fulfillment_rate: float, late_deliveries: int}>
     */
    private function supplierPerformance(): Collection
    {
        return Supplier::query()
            ->orderByDesc('performance_score')
            ->limit(5)
            ->get(['supplier_code', 'company_name', 'status', 'performance_score', 'total_orders', 'fulfilled_orders', 'late_deliveries'])
            ->map(fn (Supplier $supplier): array => [
                'name' => $supplier->company_name,
                'code' => $supplier->supplier_code,
                'status' => $supplier->status,
                'score' => (float) ($supplier->performance_score ?? 0),
                'fulfillment_rate' => $this->percent($supplier->fulfilled_orders, $supplier->total_orders),
                'late_deliveries' => $supplier->late_deliveries,
            ]);
    }

    /**
     * @return Collection<int, array{name: string, code: string, category: string|null, location: string, created_at: string|null}>
     */
    private function recentItems(): Collection
    {
        return Item::query()
            ->with(['inventoryCategory:id,name', 'warehouseLocation:id,location_code'])
            ->latest()
            ->limit(6)
            ->get(['id', 'item_code', 'name', 'category_id', 'warehouse_location_id', 'created_at'])
            ->map(fn (Item $item): array => [
                'name' => $item->name,
                'code' => $item->item_code,
                'category' => $item->inventoryCategory?->name,
                'location' => $item->warehouseLocation?->location_code ?? 'Unassigned',
                'created_at' => $item->created_at?->diffForHumans(),
            ]);
    }

    /**
     * @return array<int, array{label: string, value: string, tone: string}>
     */
    private function alerts(int $unassignedItems, float $capacity, float $usedCapacity): array
    {
        $capacityUsedPercent = $this->percent($usedCapacity, $capacity);

        return collect([
            [
                'label' => 'Unassigned active items',
                'value' => (string) $unassignedItems,
                'tone' => $unassignedItems > 0 ? 'warning' : 'good',
            ],
            [
                'label' => 'Warehouse capacity used',
                'value' => $capacityUsedPercent.'%',
                'tone' => $capacityUsedPercent >= 85 ? 'critical' : ($capacityUsedPercent >= 70 ? 'warning' : 'good'),
            ],
            [
                'label' => 'Suppliers on hold or worse',
                'value' => (string) Supplier::query()->whereIn('status', [Supplier::STATUS_ON_HOLD, Supplier::STATUS_BLACKLISTED])->count(),
                'tone' => 'warning',
            ],
        ])->values()->all();
    }

    private function percent(mixed $used, mixed $total): float
    {
        $total = (float) $total;

        return $total > 0 ? round(((float) $used / $total) * 100, 2) : 0.0;
    }
}
