<?php

use App\Models\InventoryCategory;
use App\Models\Item;
use App\Models\Supplier;
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
        'standard_cost' => 100,
    ]);
    Item::factory()->create([
        'category_id' => null,
        'warehouse_id' => null,
        'warehouse_location_id' => null,
        'standard_cost' => null,
    ]);
    Supplier::factory()->create([
        'status' => Supplier::STATUS_ACTIVE,
        'performance_score' => 92,
        'total_orders' => 10,
        'fulfilled_orders' => 9,
    ]);

    $this->actingAs($actor)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('analytics.summary.active_items', 2)
            ->where('analytics.summary.assigned_items', 1)
            ->where('analytics.summary.assignment_rate', 50.0)
            ->has('analytics.category_mix', 1)
            ->has('analytics.warehouse_utilization', 1)
            ->has('analytics.supplier_performance', 1)
            ->has('analytics.recent_items', 2)
            ->has('analytics.alerts', 3));
});
