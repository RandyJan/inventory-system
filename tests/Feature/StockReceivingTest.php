<?php

use App\Models\Item;
use App\Models\StockReceiving;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function stockReceivingActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view stock receiving module', function (): void {
    $actor = stockReceivingActor('stock-receivings.view');
    StockReceiving::factory()->create();
    Item::factory()->create([
        'item_code' => 'AAA-RCV-SCAN',
        'barcode' => 'RCV-BARCODE-001',
        'name' => 'AAA Receiving Scanner Item',
    ]);

    $this->actingAs($actor)
        ->get(route('stock-receivings.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-receivings/index')
            ->has('receivings.data', 1)
            ->has('summary')
            ->has('suppliers')
            ->has('items')
            ->where('items.0.item_code', 'AAA-RCV-SCAN')
            ->where('items.0.barcode', 'RCV-BARCODE-001'));
});

test('authorized users can record receiving and update item quantity', function (): void {
    $actor = stockReceivingActor('stock-receivings.create');
    $supplier = Supplier::factory()->active()->create([
        'total_orders' => 0,
        'fulfilled_orders' => 0,
    ]);
    $item = Item::factory()->create([
        'quantity_on_hand' => 5,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->post(route('stock-receivings.store'), [
            'receiving_number' => 'RCV-TEST-001',
            'supplier_id' => $supplier->id,
            'delivery_date' => now()->toDateString(),
            'purchase_order_reference' => 'PO-TEST-001',
            'remarks' => 'Delivered complete.',
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 12,
                    'remarks' => 'Verified count.',
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_receivings', [
        'receiving_number' => 'RCV-TEST-001',
        'supplier_id' => $supplier->id,
        'received_by' => $actor->id,
        'total_quantity_received' => 12,
    ]);

    $this->assertDatabaseHas('stock_receiving_lines', [
        'item_id' => $item->id,
        'quantity_received' => 12,
        'unit_of_measure' => 'PCS',
    ]);

    expect($item->fresh()->quantity_on_hand)->toEqual('17.00');
    expect($supplier->fresh()->fulfilled_orders)->toBe(1);

    $activity = Activity::query()
        ->where('log_name', 'inventory-tracking')
        ->where('event', 'stock-received')
        ->firstOrFail();

    expect($activity->causer_id)->toBe($actor->id)
        ->and($activity->subject_type)->toBe(StockReceiving::class)
        ->and($activity->description)->toBe('Recorded stock receiving')
        ->and($activity->properties->get('old_values'))->toMatchArray([
            "items.{$item->id}.quantity_on_hand" => 5.0,
        ])
        ->and($activity->properties->get('new_values'))->toMatchArray([
            "items.{$item->id}.quantity_on_hand" => 17.0,
            "items.{$item->id}.quantity_received" => 12.0,
            "items.{$item->id}.unit_of_measure" => 'PCS',
        ]);
});
