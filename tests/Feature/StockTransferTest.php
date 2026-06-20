<?php

use App\Models\Item;
use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
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
    Item::factory()->create([
        'item_code' => 'AAA-TRF-SCAN',
        'barcode' => 'TRF-BARCODE-001',
        'name' => 'AAA Transfer Scanner Item',
        'quantity_on_hand' => 5,
    ]);

    $this->actingAs($actor)
        ->get(route('stock-transfers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-transfers/index')
            ->has('transfers.data', 1)
            ->has('summary')
            ->has('warehouses')
            ->has('items')
            ->where('items.0.item_code', 'AAA-TRF-SCAN')
            ->where('items.0.barcode', 'TRF-BARCODE-001'));
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

test('configured workflow advances transfers through approval levels before moving items', function (): void {
    $workflow = ApprovalWorkflow::factory()->create([
        'workflow_type' => ApprovalWorkflow::TYPE_STOCK_TRANSFER,
        'name' => 'Stock Transfer Approval',
    ]);
    $workflow->steps()->createMany([
        [
            'level' => 1,
            'name' => 'Supervisor',
            'role_name' => 'Supervisor',
            'permission_name' => 'stock-transfers.approve.supervisor',
        ],
        [
            'level' => 2,
            'name' => 'Department Head',
            'role_name' => 'Department Head',
            'permission_name' => 'stock-transfers.approve.department-head',
        ],
        [
            'level' => 3,
            'name' => 'Inventory Manager',
            'role_name' => 'Inventory Manager',
            'permission_name' => 'stock-transfers.approve.inventory-manager',
        ],
    ]);

    $requester = stockTransferActor('stock-transfers.create');
    $supervisor = stockTransferActor('stock-transfers.approve.supervisor');
    $departmentHead = stockTransferActor('stock-transfers.approve.department-head');
    $inventoryManager = stockTransferActor('stock-transfers.approve.inventory-manager');
    $sourceWarehouse = Warehouse::factory()->create();
    $destinationWarehouse = Warehouse::factory()->create();
    $item = Item::factory()->create([
        'warehouse_id' => $sourceWarehouse->id,
        'quantity_on_hand' => 10,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($requester)
        ->post(route('stock-transfers.store'), [
            'transfer_number' => 'TRF-WORKFLOW-001',
            'source_warehouse_id' => $sourceWarehouse->id,
            'destination_warehouse_id' => $destinationWarehouse->id,
            'destination_location_id' => null,
            'requested_date' => now()->toDateString(),
            'remarks' => 'Move after full approval.',
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_transferred' => 4,
                ],
            ],
        ])
        ->assertRedirect();

    $transfer = StockTransfer::query()
        ->where('transfer_number', 'TRF-WORKFLOW-001')
        ->firstOrFail();

    expect($transfer->approvalSteps()->count())->toBe(3);

    $this->actingAs($supervisor)
        ->post(route('stock-transfers.approve', $transfer), [
            'approval_remarks' => 'Supervisor approved.',
        ])
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(StockTransfer::STATUS_PENDING)
        ->and($item->fresh()->warehouse_id)->toBe($sourceWarehouse->id);

    $this->assertDatabaseHas('approval_steps', [
        'approvable_id' => $transfer->id,
        'level' => 1,
        'status' => ApprovalStep::STATUS_APPROVED,
        'acted_by' => $supervisor->id,
    ]);

    $this->actingAs($departmentHead)
        ->post(route('stock-transfers.approve', $transfer), [
            'approval_remarks' => 'Department head approved.',
        ])
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(StockTransfer::STATUS_PENDING)
        ->and($item->fresh()->warehouse_id)->toBe($sourceWarehouse->id);

    $this->actingAs($inventoryManager)
        ->post(route('stock-transfers.approve', $transfer), [
            'approval_remarks' => 'Inventory manager approved.',
        ])
        ->assertRedirect();

    expect($transfer->fresh()->status)->toBe(StockTransfer::STATUS_APPROVED)
        ->and($item->fresh()->warehouse_id)->toBe($destinationWarehouse->id);
});
