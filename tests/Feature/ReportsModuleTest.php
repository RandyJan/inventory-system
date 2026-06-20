<?php

use App\Models\InventoryAdjustment;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\StockIssuance;
use App\Models\StockReceiving;
use App\Models\StockReceivingLine;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function reportsActor(bool $withPermission = true): User
{
    $actor = User::factory()->create();

    Permission::firstOrCreate([
        'name' => 'reports.view',
        'guard_name' => 'web',
    ]);

    if ($withPermission) {
        $actor->givePermissionTo('reports.view');
    }

    return $actor;
}

test('reports module is permission protected', function (): void {
    $actor = reportsActor(withPermission: false);

    $this->actingAs($actor)
        ->get(route('reports.index'))
        ->assertForbidden();
});

test('authorized users can view the reports catalog', function (): void {
    $actor = reportsActor();
    $supplier = Supplier::factory()->create();

    Item::factory()->create([
        'quantity_on_hand' => 10,
        'standard_cost' => 25,
    ]);
    StockReceiving::factory()->create();
    StockIssuance::factory()->create();
    PurchaseOrder::factory()->create([
        'supplier_id' => $supplier->id,
    ]);
    InventoryAdjustment::factory()->create([
        'adjustment_type' => InventoryAdjustment::TYPE_DAMAGED,
    ]);

    $this->actingAs($actor)
        ->get(route('reports.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->where('catalog.summary.total_reports', 18)
            ->where('catalog.summary.ready_reports', 17)
            ->where('catalog.summary.needs_data_reports', 1)
            ->has('catalog.groups', 4)
            ->where('catalog.groups.0.title', 'Available Reports')
            ->where('catalog.groups.0.reports.0.name', 'Inventory Summary Report')
            ->where('catalog.groups.1.title', 'Purchasing Reports')
            ->where('catalog.groups.1.reports.0.name', 'Supplier Performance Report')
            ->where('catalog.groups.2.title', 'Issuance Reports')
            ->where('catalog.groups.2.reports.0.name', 'Department Consumption Report')
            ->where('catalog.groups.3.title', 'Audit Reports')
            ->where('catalog.groups.3.reports.2.name', 'User Activity Report'));
});

test('authorized users can open printable report detail pages', function (): void {
    $actor = reportsActor();

    Item::factory()->create([
        'item_code' => 'SKU-REPORT-001',
        'name' => 'Report Test Item',
        'quantity_on_hand' => 10,
        'reorder_level' => 5,
    ]);

    $this->actingAs($actor)
        ->get(route('reports.show', 'inventory-summary'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/show')
            ->where('detail.report.name', 'Inventory Summary Report')
            ->where('detail.columns.0.label', 'Item Code')
            ->where('detail.rows.0.item_code', 'SKU-REPORT-001')
            ->where('detail.rows.0.item', 'Report Test Item'));
});

test('authorized users can export report detail pages as csv', function (): void {
    $actor = reportsActor();
    $item = Item::factory()->create([
        'item_code' => 'SKU-CSV-001',
        'name' => 'CSV Export Item',
    ]);
    $receiving = StockReceiving::factory()->create([
        'receiving_number' => 'RCV-CSV-001',
    ]);
    StockReceivingLine::factory()->for($receiving)->create([
        'item_id' => $item->id,
        'quantity_received' => 12,
        'unit_of_measure' => 'PCS',
    ]);

    $response = $this->actingAs($actor)
        ->get(route('reports.export', 'receiving'))
        ->assertSuccessful()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');

    expect($response->streamedContent())
        ->toContain('Receiving Number')
        ->toContain('RCV-CSV-001')
        ->toContain('SKU-CSV-001')
        ->toContain('CSV Export Item');
});
