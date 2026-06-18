<?php

use App\Models\Item;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('displays edit item form', function () {
    $item = Item::factory()->create();

    $response = $this->actingAs($this->user)->get("/items/{$item->id}/edit");

    $response->assertStatus(200);
    $response->assertSee('Edit Item');
    $response->assertSee($item->name);
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
