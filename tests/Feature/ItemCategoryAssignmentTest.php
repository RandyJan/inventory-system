<?php

use App\Models\InventoryCategory;
use App\Models\Item;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->user = User::factory()->create();

    collect(['items.create', 'items.update'])->each(function (string $permission): void {
        Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]);
    });

    $this->user->givePermissionTo(['items.create', 'items.update']);
});

it('assigns created items to managed categories and subcategories', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'Office Supplies']);
    $subcategory = InventoryCategory::factory()->create([
        'parent_id' => $category->id,
        'name' => 'Paper',
    ]);

    $this->actingAs($this->user)
        ->post(route('items.store'), [
            'item_code' => 'SKU-CAT-001',
            'name' => 'Bond Paper',
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'unit_of_measure' => 'REAM',
            'reorder_level' => 10,
            'minimum_stock_level' => 5,
            'maximum_stock_level' => 100,
        ])
        ->assertRedirect(route('items.index'));

    $this->assertDatabaseHas('items', [
        'item_code' => 'SKU-CAT-001',
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'category' => 'Office Supplies',
        'subcategory' => 'Paper',
    ]);
});

it('updates item category assignments', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'IT Equipment']);
    $subcategory = InventoryCategory::factory()->create([
        'parent_id' => $category->id,
        'name' => 'Monitors',
    ]);
    $item = Item::factory()->create([
        'category' => 'Old Category',
        'subcategory' => 'Old Subcategory',
    ]);

    $this->actingAs($this->user)
        ->put(route('items.update', $item), [
            'item_code' => $item->item_code,
            'barcode' => $item->barcode,
            'name' => $item->name,
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'unit_of_measure' => $item->unit_of_measure,
            'reorder_level' => $item->reorder_level,
            'minimum_stock_level' => $item->minimum_stock_level,
            'maximum_stock_level' => $item->maximum_stock_level,
            'standard_cost' => $item->standard_cost,
            'selling_price' => $item->selling_price,
        ])
        ->assertRedirect(route('items.index'));

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'category' => 'IT Equipment',
        'subcategory' => 'Monitors',
    ]);
});

it('rejects subcategories outside the selected category', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'Medical Supplies']);
    $otherCategory = InventoryCategory::factory()->create(['name' => 'Furniture']);
    $subcategory = InventoryCategory::factory()->create([
        'parent_id' => $otherCategory->id,
        'name' => 'Chairs',
    ]);

    $this->actingAs($this->user)
        ->post(route('items.store'), [
            'item_code' => 'SKU-CAT-002',
            'name' => 'First Aid Kit',
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'unit_of_measure' => 'PCS',
            'reorder_level' => 10,
            'minimum_stock_level' => 5,
            'maximum_stock_level' => 100,
        ])
        ->assertSessionHasErrors('subcategory_id');
});
