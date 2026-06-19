<?php

use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentLine;
use App\Models\Item;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function inventoryAdjustmentActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view inventory adjustment module', function (): void {
    $actor = inventoryAdjustmentActor('inventory-adjustments.view');
    $adjustment = InventoryAdjustment::factory()->create();
    InventoryAdjustmentLine::factory()->for($adjustment, 'adjustment')->create();

    $this->actingAs($actor)
        ->get(route('inventory-adjustments.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory-adjustments/index')
            ->has('adjustments.data', 1)
            ->has('summary')
            ->has('items')
            ->has('types')
            ->has('reasons'));
});

test('authorized users can record increase adjustments', function (): void {
    $actor = inventoryAdjustmentActor('inventory-adjustments.create');
    $item = Item::factory()->create([
        'quantity_on_hand' => 10,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->post(route('inventory-adjustments.store'), [
            'adjustment_number' => 'ADJ-TEST-001',
            'adjustment_type' => InventoryAdjustment::TYPE_INCREASE,
            'reason' => InventoryAdjustment::REASON_PHYSICAL_COUNT_VARIANCE,
            'adjustment_date' => now()->toDateString(),
            'remarks' => 'Count found extra stock.',
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_adjusted' => 7,
                    'remarks' => 'Shelf count correction.',
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventory_adjustments', [
        'adjustment_number' => 'ADJ-TEST-001',
        'adjustment_type' => InventoryAdjustment::TYPE_INCREASE,
        'reason' => InventoryAdjustment::REASON_PHYSICAL_COUNT_VARIANCE,
        'adjusted_by' => $actor->id,
        'total_quantity_adjusted' => 7,
    ]);

    $this->assertDatabaseHas('inventory_adjustment_lines', [
        'item_id' => $item->id,
        'quantity_adjusted' => 7,
        'quantity_before' => 10,
        'quantity_after' => 17,
        'unit_of_measure' => 'PCS',
    ]);

    expect($item->fresh()->quantity_on_hand)->toEqual('17.00');
});

test('authorized users can record decrease adjustments', function (): void {
    $actor = inventoryAdjustmentActor('inventory-adjustments.create');
    $item = Item::factory()->create(['quantity_on_hand' => 12]);

    $this->actingAs($actor)
        ->post(route('inventory-adjustments.store'), [
            'adjustment_number' => 'ADJ-TEST-002',
            'adjustment_type' => InventoryAdjustment::TYPE_DECREASE,
            'reason' => InventoryAdjustment::REASON_DATA_CORRECTION,
            'adjustment_date' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_adjusted' => 5,
                ],
            ],
        ])
        ->assertRedirect();

    expect($item->fresh()->quantity_on_hand)->toEqual('7.00');
});

test('authorized users can record damaged and lost items', function (string $type, string $reason): void {
    $actor = inventoryAdjustmentActor('inventory-adjustments.create');
    $item = Item::factory()->create(['quantity_on_hand' => 9]);

    $this->actingAs($actor)
        ->post(route('inventory-adjustments.store'), [
            'adjustment_type' => $type,
            'reason' => $reason,
            'adjustment_date' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_adjusted' => 3,
                ],
            ],
        ])
        ->assertRedirect();

    expect($item->fresh()->quantity_on_hand)->toEqual('6.00');
})->with([
    'damaged item recording' => [InventoryAdjustment::TYPE_DAMAGED, InventoryAdjustment::REASON_DAMAGE],
    'lost item recording' => [InventoryAdjustment::TYPE_LOST, InventoryAdjustment::REASON_THEFT_LOSS],
]);

test('decrease adjustments cannot exceed available stock', function (): void {
    $actor = inventoryAdjustmentActor('inventory-adjustments.create');
    $item = Item::factory()->create(['quantity_on_hand' => 4]);

    $this->actingAs($actor)
        ->from(route('inventory-adjustments.index'))
        ->post(route('inventory-adjustments.store'), [
            'adjustment_type' => InventoryAdjustment::TYPE_DECREASE,
            'reason' => InventoryAdjustment::REASON_DATA_CORRECTION,
            'adjustment_date' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_adjusted' => 8,
                ],
            ],
        ])
        ->assertRedirect(route('inventory-adjustments.index'))
        ->assertSessionHasErrors('lines');

    expect($item->fresh()->quantity_on_hand)->toEqual('4.00');
});
