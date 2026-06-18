<?php

use App\Models\InventoryCategory;
use App\Models\Item;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->user = User::factory()->create();

    collect([
        'inventory-categories.view',
        'inventory-categories.create',
        'inventory-categories.update',
    ])->each(function (string $permission): void {
        Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]);
    });

    $this->user->givePermissionTo([
        'inventory-categories.view',
        'inventory-categories.create',
        'inventory-categories.update',
    ]);
});

it('displays category management and reporting', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'Office Supplies']);
    $subcategory = InventoryCategory::factory()->create([
        'parent_id' => $category->id,
        'name' => 'Paper',
    ]);

    Item::factory()->create([
        'category_id' => $category->id,
        'subcategory_id' => $subcategory->id,
        'category' => 'Office Supplies',
        'subcategory' => 'Paper',
        'standard_cost' => 25,
    ]);

    $this->actingAs($this->user)
        ->get(route('inventory-categories.index'))
        ->assertSuccessful()
        ->assertSee('Inventory Categories')
        ->assertSee('Office Supplies')
        ->assertSee('Paper');
});

it('creates top-level categories', function (): void {
    $this->actingAs($this->user)
        ->post(route('inventory-categories.store'), [
            'name' => 'IT Equipment',
            'description' => 'Devices and peripherals',
            'is_active' => true,
        ])
        ->assertRedirect(route('inventory-categories.index'));

    $this->assertDatabaseHas('inventory_categories', [
        'name' => 'IT Equipment',
        'parent_id' => null,
    ]);
});

it('creates subcategories under a parent category', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'Furniture']);

    $this->actingAs($this->user)
        ->post(route('inventory-categories.store'), [
            'parent_id' => $category->id,
            'name' => 'Chairs',
            'is_active' => true,
        ])
        ->assertRedirect(route('inventory-categories.index'));

    $this->assertDatabaseHas('inventory_categories', [
        'name' => 'Chairs',
        'parent_id' => $category->id,
    ]);
});

it('updates categories', function (): void {
    $category = InventoryCategory::factory()->create(['name' => 'Old Name']);

    $this->actingAs($this->user)
        ->put(route('inventory-categories.update', $category), [
            'name' => 'New Name',
            'description' => 'Updated description',
            'is_active' => false,
        ])
        ->assertRedirect(route('inventory-categories.index'));

    $this->assertDatabaseHas('inventory_categories', [
        'id' => $category->id,
        'name' => 'New Name',
        'description' => 'Updated description',
        'is_active' => false,
    ]);
});

it('prevents duplicate names at the same category level', function (): void {
    InventoryCategory::factory()->create(['name' => 'Consumables']);

    $this->actingAs($this->user)
        ->post(route('inventory-categories.store'), [
            'name' => 'Consumables',
            'is_active' => true,
        ])
        ->assertSessionHasErrors('name');
});
