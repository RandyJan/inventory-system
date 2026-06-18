<?php

use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function warehouseActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view warehouse management', function (): void {
    $actor = warehouseActor('warehouses.view');
    Warehouse::factory()->create(['name' => 'Main Warehouse']);

    $this->actingAs($actor)
        ->get(route('warehouses.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('warehouses/index')
            ->has('warehouses', 1)
            ->has('summary'));
});

test('authorized users can create warehouses', function (): void {
    $actor = warehouseActor('warehouses.create');
    $manager = User::factory()->create();

    $this->actingAs($actor)
        ->post(route('warehouses.store'), [
            'warehouse_code' => 'WH-MAIN',
            'name' => 'Main Warehouse',
            'type' => 'warehouse',
            'manager_id' => $manager->id,
            'capacity' => 1000,
            'used_capacity' => 250,
            'is_active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('warehouses', [
        'warehouse_code' => 'WH-MAIN',
        'manager_id' => $manager->id,
        'is_active' => true,
    ]);
});

test('authorized users can update warehouses and deactivate them', function (): void {
    $actor = warehouseActor('warehouses.update');
    $warehouse = Warehouse::factory()->create(['is_active' => true]);

    $this->actingAs($actor)
        ->put(route('warehouses.update', $warehouse), [
            'warehouse_code' => $warehouse->warehouse_code,
            'name' => 'Closed Warehouse',
            'type' => 'stockroom',
            'manager_id' => null,
            'capacity' => 100,
            'used_capacity' => 0,
            'is_active' => false,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('warehouses', [
        'id' => $warehouse->id,
        'name' => 'Closed Warehouse',
        'is_active' => false,
    ]);
});

test('authorized users can create warehouse locations', function (): void {
    $actor = warehouseActor('warehouses.update');
    $warehouse = Warehouse::factory()->create();

    $this->actingAs($actor)
        ->post(route('warehouse-locations.store'), [
            'warehouse_id' => $warehouse->id,
            'location_code' => 'A-01-BIN-01',
            'building' => 'Main Building',
            'floor' => '2',
            'room' => 'Supply Room',
            'rack' => 'Rack A',
            'shelf' => 'Shelf 1',
            'bin' => 'Bin 01',
            'capacity' => 50,
            'used_capacity' => 10,
            'is_active' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('warehouse_locations', [
        'warehouse_id' => $warehouse->id,
        'location_code' => 'A-01-BIN-01',
        'building' => 'Main Building',
        'floor' => '2',
        'room' => 'Supply Room',
        'rack' => 'Rack A',
        'shelf' => 'Shelf 1',
        'bin' => 'Bin 01',
    ]);
});

test('authorized users can update and deactivate warehouse locations', function (): void {
    $actor = warehouseActor('warehouses.update');
    $location = WarehouseLocation::factory()->create(['is_active' => true]);

    $this->actingAs($actor)
        ->put(route('warehouse-locations.update', $location), [
            'warehouse_id' => $location->warehouse_id,
            'location_code' => 'B-02-RACK-03',
            'building' => 'Annex',
            'floor' => '3',
            'room' => 'Records',
            'rack' => 'Rack B',
            'shelf' => 'Shelf 2',
            'bin' => 'Bin 03',
            'capacity' => 75,
            'used_capacity' => 15,
            'is_active' => false,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('warehouse_locations', [
        'id' => $location->id,
        'location_code' => 'B-02-RACK-03',
        'building' => 'Annex',
        'is_active' => false,
    ]);
});

test('authorized users can assign items to warehouse locations', function (): void {
    $actor = warehouseActor('warehouses.update');
    $location = WarehouseLocation::factory()->create();
    $item = Item::factory()->create();

    $this->actingAs($actor)
        ->put(route('warehouse-locations.items.update', $location), [
            'item_ids' => [$item->id],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'warehouse_id' => $location->warehouse_id,
        'warehouse_location_id' => $location->id,
    ]);
});

test('authorized users can set warehouse specific permissions', function (): void {
    $actor = warehouseActor('warehouses.permissions');
    $warehouse = Warehouse::factory()->create();
    $staff = User::factory()->create();

    $this->actingAs($actor)
        ->put(route('warehouses.permissions.update', $warehouse), [
            'permissions' => [
                [
                    'user_id' => $staff->id,
                    'can_view' => true,
                    'can_receive' => true,
                    'can_transfer' => false,
                    'can_adjust' => false,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('warehouse_user_permissions', [
        'warehouse_id' => $warehouse->id,
        'user_id' => $staff->id,
        'can_view' => true,
        'can_receive' => true,
    ]);
});
