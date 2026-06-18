<?php

use App\Models\Item;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

it('displays items list page', function () {
    Item::factory(5)->create();

    $response = $this->actingAs($this->user)->get('/items');

    $response->assertStatus(200);
    $response->assertSee('Items');
});

it('filters items by search term', function () {
    $item = Item::factory()->create(['name' => 'Office Chair', 'item_code' => 'SKU-001']);
    Item::factory(4)->create();

    $response = $this->actingAs($this->user)->get('/items?search=Office');

    $response->assertStatus(200);
    $response->assertSee('Office Chair');
});

it('filters items by category', function () {
    $item = Item::factory()->create(['category' => 'Office Supplies']);
    Item::factory()->create(['category' => 'IT Equipment']);

    $response = $this->actingAs($this->user)->get('/items?category=Office%20Supplies');

    $response->assertStatus(200);
});

it('shows only active items by default', function () {
    Item::factory()->create(['is_archived' => false]);
    Item::factory()->create(['is_archived' => true]);

    $response = $this->actingAs($this->user)->get('/items');

    $response->assertStatus(200);
});

it('shows archived items when requested', function () {
    Item::factory()->create(['is_archived' => true]);

    $response = $this->actingAs($this->user)->get('/items?show_archived=1');

    $response->assertStatus(200);
});
