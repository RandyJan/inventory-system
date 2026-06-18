<?php

use App\Models\Item;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('displays item details page', function () {
    $item = Item::factory()->create();

    $response = $this->actingAs($this->user)->get("/items/{$item->id}");

    $response->assertStatus(200);
    $response->assertSee($item->name);
    $response->assertSee($item->item_code);
    $response->assertSee($item->category);
});

it('displays all item information', function () {
    $item = Item::factory()->create([
        'name' => 'Test Item',
        'item_code' => 'SKU-123',
        'category' => 'Office Supplies',
        'brand' => 'Test Brand',
    ]);

    $response = $this->actingAs($this->user)->get("/items/{$item->id}");

    $response->assertStatus(200);
    $response->assertSee('Test Item');
    $response->assertSee('SKU-123');
    $response->assertSee('Office Supplies');
    $response->assertSee('Test Brand');
});

it('returns 404 for non-existent item', function () {
    $response = $this->actingAs($this->user)->get('/items/99999');

    $response->assertStatus(404);
});
