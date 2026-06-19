<?php

use App\Models\Item;
use App\Models\InventoryCategory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->user = User::factory()->create();

    collect(['items.view', 'items.update', 'items.delete'])
        ->each(fn (string $permission): Permission => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));

    $this->user->givePermissionTo(['items.view', 'items.update', 'items.delete']);
});

it('displays edit item form', function () {
    $item = Item::factory()->create();

    $response = $this->actingAs($this->user)->get("/items/{$item->id}/edit");

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('items/edit')
        ->where('item.id', $item->id)
        ->where('item.name', $item->name));
});

it('updates an item', function () {
    $item = Item::factory()->create(['name' => 'Old Name']);

    $data = [
        'item_code' => $item->item_code,
        'name' => 'Updated Name',
        'category' => 'IT Equipment',
        'unit_of_measure' => 'BOX',
        'reorder_level' => 15,
        'minimum_stock_level' => 8,
        'maximum_stock_level' => 150,
    ];

    $response = $this->actingAs($this->user)->put("/items/{$item->id}", $data);

    $response->assertRedirect('/items');
    $item->refresh();
    $this->assertEquals('Updated Name', $item->name);
    $this->assertEquals('IT Equipment', $item->category);
});

it('updates item category without failing unique item code validation', function () {
    $item = Item::factory()->create([
        'item_code' => 'SKU-861651',
        'barcode' => '1234567890123',
        'name' => 'Categorized Item',
        'category' => 'Old Category',
    ]);
    $category = InventoryCategory::factory()->create(['name' => 'IT Equipment']);
    $subcategory = InventoryCategory::factory()->create([
        'parent_id' => $category->id,
        'name' => 'Laptops',
    ]);

    $response = $this->actingAs($this->user)->put("/items/{$item->id}", [
        'item_code' => $item->item_code,
        'barcode' => $item->barcode,
        'name' => $item->name,
        'category' => $item->category,
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'unit_of_measure' => $item->unit_of_measure,
        'reorder_level' => 15,
        'minimum_stock_level' => 8,
        'maximum_stock_level' => 150,
    ]);

    $response->assertRedirect('/items');

    expect($item->fresh())
        ->category_id->toBe($category->id)
        ->subcategory_id->toBe($subcategory->id)
        ->category->toBe('IT Equipment')
        ->subcategory->toBe('Laptops');
});

it('archives an item', function () {
    $item = Item::factory()->create(['is_archived' => false]);

    $response = $this->actingAs($this->user)->delete("/items/{$item->id}");

    $response->assertRedirect('/items');
    $item->refresh();
    $this->assertTrue($item->is_archived);
});

it('validates required fields on update', function () {
    $item = Item::factory()->create();

    $data = [
        'name' => 'Updated Name',
    ];

    $response = $this->actingAs($this->user)->put("/items/{$item->id}", $data);

    $response->assertSessionHasErrors(['item_code', 'category', 'unit_of_measure']);
});
