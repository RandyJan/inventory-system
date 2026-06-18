<?php

use App\Models\PurchaseRequisition;
use App\Models\PurchaseRequisitionLine;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function purchaseRequisitionActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view purchase requisition module', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.view');
    $requisition = PurchaseRequisition::factory()->create();
    PurchaseRequisitionLine::factory()->for($requisition)->create();

    $this->actingAs($actor)
        ->get(route('purchase-requisitions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-requisitions/index')
            ->has('requisitions.data', 1)
            ->has('summary')
            ->has('items')
            ->has('statuses'));
});

test('authorized users can create draft purchase requisitions', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.create');

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.store'), requisitionPayload([
            'requisition_number' => 'PR-TEST-001',
            'submit' => false,
        ]))
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_requisitions', [
        'requisition_number' => 'PR-TEST-001',
        'requested_by' => $actor->id,
        'status' => PurchaseRequisition::STATUS_DRAFT,
        'estimated_total' => 1500,
    ]);
});

test('authorized users can submit purchase requisitions on create', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.create');

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.store'), requisitionPayload([
            'requisition_number' => 'PR-TEST-002',
            'submit' => true,
        ]))
        ->assertRedirect();

    $requisition = PurchaseRequisition::query()
        ->where('requisition_number', 'PR-TEST-002')
        ->firstOrFail();

    expect($requisition->status)->toBe(PurchaseRequisition::STATUS_SUBMITTED)
        ->and($requisition->submitted_at)->not->toBeNull();
});

test('draft requisitions can be submitted', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.submit');
    $requisition = PurchaseRequisition::factory()->create([
        'status' => PurchaseRequisition::STATUS_DRAFT,
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.submit', $requisition))
        ->assertRedirect();

    expect($requisition->fresh()->status)->toBe(PurchaseRequisition::STATUS_SUBMITTED);
});

test('submitted requisitions can be approved', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.approve');
    $requisition = PurchaseRequisition::factory()->create([
        'status' => PurchaseRequisition::STATUS_SUBMITTED,
        'submitted_at' => now(),
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.approve', $requisition), [
            'approval_remarks' => 'Approved for procurement.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_requisitions', [
        'id' => $requisition->id,
        'status' => PurchaseRequisition::STATUS_APPROVED,
        'supervisor_id' => $actor->id,
        'approval_remarks' => 'Approved for procurement.',
    ]);
});

test('submitted requisitions can be rejected', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.approve');
    $requisition = PurchaseRequisition::factory()->create([
        'status' => PurchaseRequisition::STATUS_SUBMITTED,
        'submitted_at' => now(),
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.reject', $requisition), [
            'approval_remarks' => 'Insufficient justification.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_requisitions', [
        'id' => $requisition->id,
        'status' => PurchaseRequisition::STATUS_REJECTED,
        'supervisor_id' => $actor->id,
        'approval_remarks' => 'Insufficient justification.',
    ]);
});

test('approved requisitions can be converted to purchase order status', function (): void {
    $actor = purchaseRequisitionActor('purchase-requisitions.convert');
    $requisition = PurchaseRequisition::factory()->create([
        'status' => PurchaseRequisition::STATUS_APPROVED,
        'approved_at' => now(),
    ]);

    $this->actingAs($actor)
        ->post(route('purchase-requisitions.convert', $requisition), [
            'purchase_order_reference' => 'PO-TEST-001',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('purchase_requisitions', [
        'id' => $requisition->id,
        'status' => PurchaseRequisition::STATUS_CONVERTED,
        'purchasing_id' => $actor->id,
        'purchase_order_reference' => 'PO-TEST-001',
    ]);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function requisitionPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'requisition_number' => 'PR-TEST',
        'requesting_department' => 'Operations',
        'purpose' => 'Replace depleted office supplies',
        'needed_date' => now()->addWeek()->toDateString(),
        'remarks' => 'Needed for daily operations.',
        'submit' => false,
        'lines' => [
            [
                'item_id' => null,
                'item_description' => 'Bond paper',
                'quantity_requested' => 10,
                'unit_of_measure' => 'REAM',
                'estimated_unit_cost' => 150,
                'remarks' => 'A4 size',
            ],
        ],
    ], $overrides);
}
