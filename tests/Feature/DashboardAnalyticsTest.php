<?php

use App\Models\InventoryCategory;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\StockIssuance;
use App\Models\StockIssuanceLine;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function dashboardActor(): User
{
    $actor = User::factory()->create();

    Permission::firstOrCreate([
        'name' => 'dashboard.view',
        'guard_name' => 'web',
    ]);

    $actor->givePermissionTo('dashboard.view');

    return $actor;
}

test('dashboard renders useful inventory analytics', function (): void {
    $actor = dashboardActor();
    $category = InventoryCategory::factory()->create(['name' => 'IT Equipment']);
    $warehouse = Warehouse::factory()->create([
        'capacity' => 100,
        'used_capacity' => 40,
    ]);
    $location = WarehouseLocation::factory()->create([
        'warehouse_id' => $warehouse->id,
        'capacity' => 50,
        'used_capacity' => 20,
    ]);

    Item::factory()->create([
        'category_id' => $category->id,
        'warehouse_id' => $warehouse->id,
        'warehouse_location_id' => $location->id,
        'quantity_on_hand' => 25,
        'reorder_level' => 10,
        'standard_cost' => 100,
    ]);
    Item::factory()->create([
        'category_id' => null,
        'warehouse_id' => null,
        'warehouse_location_id' => null,
        'quantity_on_hand' => 0,
        'reorder_level' => 10,
        'standard_cost' => null,
    ]);
    $consumedItem = Item::factory()->create([
        'quantity_on_hand' => 5,
        'reorder_level' => 10,
        'standard_cost' => 10,
        'unit_of_measure' => 'PCS',
    ]);
    $supplier = Supplier::factory()->create([
        'status' => Supplier::STATUS_ACTIVE,
        'performance_score' => 92,
        'total_orders' => 10,
        'fulfilled_orders' => 9,
    ]);
    PurchaseOrder::factory()->create([
        'supplier_id' => $supplier->id,
        'status' => PurchaseOrder::STATUS_PENDING,
    ]);
    $issuance = StockIssuance::factory()->create([
        'total_quantity_issued' => 7,
    ]);
    StockIssuanceLine::factory()->for($issuance)->create([
        'item_id' => $consumedItem->id,
        'quantity_issued' => 7,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('analytics.summary.active_items', 3)
            ->where('analytics.summary.assigned_items', 1)
            ->where('analytics.summary.assignment_rate', 33.33)
            ->where('analytics.stock_monitoring.current_inventory_value', 2550)
            ->where('analytics.stock_monitoring.total_items', 3)
            ->where('analytics.stock_monitoring.low_stock_items', 1)
            ->where('analytics.stock_monitoring.out_of_stock_items', 1)
            ->where('analytics.stock_monitoring.pending_purchase_orders', 1)
            ->has('analytics.category_mix', 1)
            ->has('analytics.warehouse_utilization', 1)
            ->has('analytics.supplier_performance', 1)
            ->has('analytics.recent_items', 3)
            ->has('analytics.recent_transactions', 1)
            ->has('analytics.top_consumed_items', 1)
            ->where('analytics.top_consumed_items.0.quantity', 7)
            ->has('analytics.alerts', 3));
});
