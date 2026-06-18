<?php

use App\Models\Item;
use App\Models\StockTransfer;
use App\Models\StockTransferLine;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function stockTransferActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view stock transfer module', function (): void {
    $actor = stockTransferActor('stock-transfers.view');
    $transfer = StockTransfer::factory()->create();
    StockTransferLine::factory()->for($transfer)->create();

    $this->actingAs($actor)
        ->get(route('stock-transfers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-transfers/index')
            ->has('transfers.data', 1)
            ->has('summary')
            ->has('warehouses')
            ->has('items'));
});

test('authorized users can create pending transfer requests', function (): void {
    $actor = stockTransferActor('stock-transfers.create');
    $sourceWarehouse = Warehouse::factory()->create();
    $destinationWarehouse = Warehouse::factory()->create();
    $destinationLocation = WarehouseLocation::factory()->for($destinationWarehouse)->create();
    $item = Item::factory()->create([
        'warehouse_id' => $sourceWarehouse->id,
        'quantity_on_hand' => 10,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->post(route('stock-transfers.store'), [
            'transfer_number' => 'TRF-TEST-001',
            'source_warehouse_id' => $sourceWarehouse->id,
            'destination_warehouse_id' => $destinationWarehouse->id,
            'destination_location_id' => $destinationLocation->id,
            'requested_date' => now()->toDateString(),
            'remarks' => 'Move to destination warehouse.',
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_transferred' => 4,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_transfers', [
        'transfer_number' => 'TRF-TEST-001',
        'source_warehouse_id' => $sourceWarehouse->id,
        'destination_warehouse_id' => $destinationWarehouse->id,
        'destination_location_id' => $destinationLocation->id,
        'requested_by' => $actor->id,
        'status' => StockTransfer::STATUS_PENDING,
        'total_quantity_transferred' => 4,
    ]);

    $this->assertDatabaseHas('stock_transfer_lines', [
        'item_id' => $item->id,
        'quantity_transferred' => 4,
        'unit_of_measure' => 'PCS',
    ]);

    expect($item->fresh()->warehouse_id)->toBe($sourceWarehouse->id);
});

test('authorized users can approve transfers and move items', function (): void {
    $actor = stockTransferActor('stock-transfers.approve');
    $sourceWarehouse = Warehouse::factory()->create();
    $destinationWarehouse = Warehouse::factory()->create();
    $destinationLocation = WarehouseLocation::factory()->for($destinationWarehouse)->create();
    $item = Item::factory()->create([
        'warehouse_id' => $sourceWarehouse->id,
        'warehouse_location_id' => null,
        'quantity_on_hand' => 10,
        'unit_of_measure' => 'PCS',
    ]);
    $transfer = StockTransfer::factory()->create([
        'source_warehouse_id' => $sourceWarehouse->id,
        'destination_warehouse_id' => $destinationWarehouse->id,
        'destination_location_id' => $destinationLocation->id,
        'status' => StockTransfer::STATUS_PENDING,
    ]);
    StockTransferLine::factory()->for($transfer)->create([
        'item_id' => $item->id,
        'quantity_transferred' => 4,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->post(route('stock-transfers.approve', $transfer), [
            'approval_remarks' => 'Approved.',
        ])
        ->assertRedirect();

    expect($item->fresh())
        ->warehouse_id->toBe($destinationWarehouse->id)
        ->warehouse_location_id->toBe($destinationLocation->id);

    $this->assertDatabaseHas('stock_transfers', [
        'id' => $transfer->id,
        'status' => StockTransfer::STATUS_APPROVED,
        'approved_by' => $actor->id,
        'approval_remarks' => 'Approved.',
    ]);
});

test('authorized users can reject pending transfers', function (): void {
    $actor = stockTransferActor('stock-transfers.approve');
    $transfer = StockTransfer::factory()->create([
        'status' => StockTransfer::STATUS_PENDING,
    ]);

    $this->actingAs($actor)
        ->post(route('stock-transfers.reject', $transfer), [
            'approval_remarks' => 'Wrong destination.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_transfers', [
        'id' => $transfer->id,
        'status' => StockTransfer::STATUS_REJECTED,
        'approved_by' => $actor->id,
        'approval_remarks' => 'Wrong destination.',
    ]);
});
