<?php

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\PurchaseRequisition;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function purchaseOrderActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view purchase order module', function (): void {
    $actor = purchaseOrderActor('purchase-orders.view');
    $purchaseOrder = PurchaseOrder::factory()->create();
    PurchaseOrderLine::factory()->for($purchaseOrder)->create();

    $this->actingAs($actor)
        ->get(route('purchase-orders.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-orders/index')
            ->has('purchaseOrders.data', 1)
            ->has('summary')
            ->has('suppliers')
            ->has('items'));
});

test('authorized users can create draft purchase orders', function (): void {
    $actor = purchaseOrderActor('purchase-orders.create');
    $supplier = Supplier::factory()->active()->create();

    $this->actingAs($actor)
        ->post(route('purchase-orders.store'), purchaseOrderPayload([
            'po_number' => 'PO-TEST-001',
            'supplier_id' => $supplier->id,
            'submit' => false,
        ]))
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_orders', [
        'po_number' => 'PO-TEST-001',
        'supplier_id' => $supplier->id,
        'created_by' => $actor->id,
        'status' => PurchaseOrder::STATUS_DRAFT,
        'total_amount' => 1500,
    ]);
});

test('authorized users can submit purchase orders on create', function (): void {
    $actor = purchaseOrderActor('purchase-orders.create');
    $supplier = Supplier::factory()->active()->create();

    $this->actingAs($actor)
        ->post(route('purchase-orders.store'), purchaseOrderPayload([
            'po_number' => 'PO-TEST-002',
            'supplier_id' => $supplier->id,
            'submit' => true,
        ]))
        ->assertRedirect();

    expect(PurchaseOrder::where('po_number', 'PO-TEST-002')->firstOrFail()->status)
        ->toBe(PurchaseOrder::STATUS_PENDING);
});

test('draft purchase orders can be submitted', function (): void {
    $actor = purchaseOrderActor('purchase-orders.submit');
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => PurchaseOrder::STATUS_DRAFT,
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-orders.submit', $purchaseOrder))
        ->assertRedirect();

    expect($purchaseOrder->fresh()->status)->toBe(PurchaseOrder::STATUS_PENDING);
});

test('pending purchase orders can be approved', function (): void {
    $actor = purchaseOrderActor('purchase-orders.approve');
    $supplier = Supplier::factory()->active()->create([
        'total_orders' => 0,
    ]);
    $requisition = PurchaseRequisition::factory()->create([
        'status' => PurchaseRequisition::STATUS_APPROVED,
    ]);
    $purchaseOrder = PurchaseOrder::factory()->create([
        'supplier_id' => $supplier->id,
        'purchase_requisition_id' => $requisition->id,
        'status' => PurchaseOrder::STATUS_PENDING,
        'po_number' => 'PO-APPROVE-001',
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-orders.approve', $purchaseOrder), [
            'approval_remarks' => 'Approved.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $purchaseOrder->id,
        'status' => PurchaseOrder::STATUS_APPROVED,
        'approved_by' => $actor->id,
        'approval_remarks' => 'Approved.',
    ]);

    expect($supplier->fresh()->total_orders)->toBe(1)
        ->and($requisition->fresh()->status)->toBe(PurchaseRequisition::STATUS_CONVERTED)
        ->and($requisition->fresh()->purchase_order_reference)->toBe('PO-APPROVE-001');
});

test('pending purchase orders can be rejected', function (): void {
    $actor = purchaseOrderActor('purchase-orders.approve');
    $purchaseOrder = PurchaseOrder::factory()->create([
        'status' => PurchaseOrder::STATUS_PENDING,
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-orders.reject', $purchaseOrder), [
            'approval_remarks' => 'Pricing needs review.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_orders', [
        'id' => $purchaseOrder->id,
        'status' => PurchaseOrder::STATUS_REJECTED,
        'approved_by' => $actor->id,
        'approval_remarks' => 'Pricing needs review.',
    ]);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function purchaseOrderPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'po_number' => 'PO-TEST',
        'supplier_id' => Supplier::factory()->active()->create()->id,
        'purchase_requisition_id' => null,
        'order_date' => now()->toDateString(),
        'expected_delivery_date' => now()->addWeek()->toDateString(),
        'remarks' => 'Standard purchase order.',
        'submit' => false,
        'lines' => [
            [
                'item_id' => null,
                'item_description' => 'Bond paper',
                'quantity_ordered' => 10,
                'unit_of_measure' => 'REAM',
                'unit_cost' => 150,
                'remarks' => 'A4 size',
            ],
        ],
    ], $overrides);
}
