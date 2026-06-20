<?php

use App\Models\Item;
use App\Models\StockIssuance;
use App\Models\StockIssuanceLine;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function stockIssuanceActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view stock issuance module', function (): void {
    $actor = stockIssuanceActor('stock-issuances.view');
    $issuance = StockIssuance::factory()->create();
    StockIssuanceLine::factory()->for($issuance)->create();
    Item::factory()->create([
        'item_code' => 'AAA-ISS-SCAN',
        'barcode' => 'ISS-BARCODE-001',
        'name' => 'AAA Issuance Scanner Item',
        'quantity_on_hand' => 5,
    ]);

    $this->actingAs($actor)
        ->get(route('stock-issuances.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-issuances/index')
            ->has('issuances.data', 1)
            ->has('summary')
            ->has('departments')
            ->has('items')
            ->where('items.0.item_code', 'AAA-ISS-SCAN')
            ->where('items.0.barcode', 'ISS-BARCODE-001'));
});

test('authorized users can record issuance and deduct item quantity', function (): void {
    $actor = stockIssuanceActor('stock-issuances.create');
    $item = Item::factory()->create([
        'quantity_on_hand' => 20,
        'unit_of_measure' => 'PCS',
    ]);

    $this->actingAs($actor)
        ->post(route('stock-issuances.store'), [
            'issue_number' => 'ISS-TEST-001',
            'requesting_department' => 'Operations',
            'requestor' => 'Juan Dela Cruz',
            'date_issued' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_issued' => 12,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_issuances', [
        'issue_number' => 'ISS-TEST-001',
        'requesting_department' => 'Operations',
        'requestor' => 'Juan Dela Cruz',
        'released_by' => $actor->id,
        'total_quantity_issued' => 12,
    ]);

    $this->assertDatabaseHas('stock_issuance_lines', [
        'item_id' => $item->id,
        'quantity_issued' => 12,
        'unit_of_measure' => 'PCS',
    ]);

    expect($item->fresh()->quantity_on_hand)->toEqual('8.00');
});

test('issuance cannot exceed available stock', function (): void {
    $actor = stockIssuanceActor('stock-issuances.create');
    $item = Item::factory()->create([
        'quantity_on_hand' => 5,
    ]);

    $this->actingAs($actor)
        ->from(route('stock-issuances.index'))
        ->post(route('stock-issuances.store'), [
            'issue_number' => 'ISS-TEST-002',
            'requesting_department' => 'Operations',
            'requestor' => 'Maria Santos',
            'date_issued' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'quantity_issued' => 8,
                ],
            ],
        ])
        ->assertRedirect(route('stock-issuances.index'))
        ->assertSessionHasErrors('lines');

    expect($item->fresh()->quantity_on_hand)->toEqual('5.00');
});
