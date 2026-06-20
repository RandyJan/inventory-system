<?php

use App\Models\Item;
use App\Models\StockCount;
use App\Models\StockCountLine;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function stockCountActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view stock count module', function (): void {
    $actor = stockCountActor('stock-counts.view');
    $count = StockCount::factory()->create();
    StockCountLine::factory()->for($count)->create();
    Item::factory()->create([
        'item_code' => 'AAA-CNT-SCAN',
        'barcode' => 'CNT-BARCODE-001',
        'name' => 'AAA Count Scanner Item',
    ]);

    $this->actingAs($actor)
        ->get(route('stock-counts.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('stock-counts/index')
            ->has('counts.data', 1)
            ->has('summary')
            ->has('items')
            ->where('items.0.item_code', 'AAA-CNT-SCAN')
            ->where('items.0.barcode', 'CNT-BARCODE-001')
            ->has('types'));
});

test('authorized users can record cycle counts with variance recommendations', function (): void {
    $actor = stockCountActor('stock-counts.create');
    $increaseItem = Item::factory()->create([
        'quantity_on_hand' => 10,
        'unit_of_measure' => 'PCS',
    ]);
    $decreaseItem = Item::factory()->create([
        'quantity_on_hand' => 8,
        'unit_of_measure' => 'BOX',
    ]);
    $matchedItem = Item::factory()->create([
        'quantity_on_hand' => 5,
        'unit_of_measure' => 'PACK',
    ]);

    $this->actingAs($actor)
        ->post(route('stock-counts.store'), [
            'count_number' => 'CNT-TEST-001',
            'count_type' => StockCount::TYPE_CYCLE,
            'count_date' => now()->toDateString(),
            'remarks' => 'Cycle count for fast-moving items.',
            'lines' => [
                [
                    'item_id' => $increaseItem->id,
                    'actual_quantity' => 14,
                    'remarks' => 'Found extra stock.',
                ],
                [
                    'item_id' => $decreaseItem->id,
                    'actual_quantity' => 3,
                    'remarks' => 'Missing stock.',
                ],
                [
                    'item_id' => $matchedItem->id,
                    'actual_quantity' => 5,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_counts', [
        'count_number' => 'CNT-TEST-001',
        'count_type' => StockCount::TYPE_CYCLE,
        'counted_by' => $actor->id,
        'total_items_counted' => 3,
        'variance_items_count' => 2,
        'total_absolute_variance' => 9,
    ]);

    $this->assertDatabaseHas('stock_count_lines', [
        'item_id' => $increaseItem->id,
        'system_quantity' => 10,
        'actual_quantity' => 14,
        'variance_quantity' => 4,
        'recommendation' => StockCountLine::RECOMMENDATION_INCREASE,
    ]);

    $this->assertDatabaseHas('stock_count_lines', [
        'item_id' => $decreaseItem->id,
        'system_quantity' => 8,
        'actual_quantity' => 3,
        'variance_quantity' => -5,
        'recommendation' => StockCountLine::RECOMMENDATION_DECREASE,
    ]);

    $this->assertDatabaseHas('stock_count_lines', [
        'item_id' => $matchedItem->id,
        'system_quantity' => 5,
        'actual_quantity' => 5,
        'variance_quantity' => 0,
        'recommendation' => StockCountLine::RECOMMENDATION_NONE,
    ]);

    expect($increaseItem->fresh()->quantity_on_hand)->toEqual('10.00')
        ->and($decreaseItem->fresh()->quantity_on_hand)->toEqual('8.00');
});

test('authorized users can record annual inventory counts', function (): void {
    $actor = stockCountActor('stock-counts.create');
    $item = Item::factory()->create(['quantity_on_hand' => 20]);

    $this->actingAs($actor)
        ->post(route('stock-counts.store'), [
            'count_number' => 'CNT-ANNUAL-001',
            'count_type' => StockCount::TYPE_ANNUAL,
            'count_date' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'actual_quantity' => 18,
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('stock_counts', [
        'count_number' => 'CNT-ANNUAL-001',
        'count_type' => StockCount::TYPE_ANNUAL,
    ]);
});

test('actual quantities cannot be negative', function (): void {
    $actor = stockCountActor('stock-counts.create');
    $item = Item::factory()->create(['quantity_on_hand' => 4]);

    $this->actingAs($actor)
        ->from(route('stock-counts.index'))
        ->post(route('stock-counts.store'), [
            'count_type' => StockCount::TYPE_CYCLE,
            'count_date' => now()->toDateString(),
            'lines' => [
                [
                    'item_id' => $item->id,
                    'actual_quantity' => -1,
                ],
            ],
        ])
        ->assertRedirect(route('stock-counts.index'))
        ->assertSessionHasErrors('lines.0.actual_quantity');
});
