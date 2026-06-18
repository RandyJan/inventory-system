<?php

use App\Models\Item;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('displays create item form', function () {
    $response = $this->actingAs($this->user)->get('/items/create');

    $response->assertStatus(200);
    $response->assertSee('Create Item');
});

it('creates a new item', function () {
    $data = [
        'item_code' => 'SKU-NEW-001',
        'barcode' => '1234567890123',
        'name' => 'Test Item',
        'description' => 'Test Description',
        'category' => 'Office Supplies',
        'subcategory' => 'Paper',
        'unit_of_measure' => 'BOX',
        'brand' => 'Brand X',
        'manufacturer' => 'Manufacturer Y',
        'reorder_level' => 10,
        'minimum_stock_level' => 5,
        'maximum_stock_level' => 100,
        'standard_cost' => 10.50,
        'selling_price' => 20.00,
    ];

    $response = $this->actingAs($this->user)->post('/items', $data);

    $response->assertRedirect('/items');
    $this->assertDatabaseHas('items', ['item_code' => 'SKU-NEW-001']);
});

it('validates required item code', function () {
    $data = [
        'barcode' => '1234567890123',
        'name' => 'Test Item',
        'category' => 'Office Supplies',
        'unit_of_measure' => 'BOX',
        'reorder_level' => 10,
        'minimum_stock_level' => 5,
        'maximum_stock_level' => 100,
    ];

    $response = $this->actingAs($this->user)->post('/items', $data);

    $response->assertSessionHasErrors('item_code');
});

it('validates unique item code', function () {
    Item::factory()->create(['item_code' => 'SKU-001']);

    $data = [
        'item_code' => 'SKU-001',
        'name' => 'Duplicate Item',
        'category' => 'Office Supplies',
        'unit_of_measure' => 'BOX',
        'reorder_level' => 10,
        'minimum_stock_level' => 5,
        'maximum_stock_level' => 100,
    ];

    $response = $this->actingAs($this->user)->post('/items', $data);

    $response->assertSessionHasErrors('item_code');
});

it('validates unique barcode', function () {
    Item::factory()->create(['barcode' => '1234567890123']);

    $data = [
        'item_code' => 'SKU-NEW-001',
        'barcode' => '1234567890123',
        'name' => 'Test Item',
        'category' => 'Office Supplies',
        'unit_of_measure' => 'BOX',
        'reorder_level' => 10,
        'minimum_stock_level' => 5,
        'maximum_stock_level' => 100,
    ];

    $response = $this->actingAs($this->user)->post('/items', $data);

    $response->assertSessionHasErrors('barcode');
});
