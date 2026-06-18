<?php

use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view supplier management', function (): void {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'suppliers.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('suppliers.view');

    Supplier::factory()->create(['company_name' => 'Acme Supplies']);

    $this->actingAs($actor)
        ->get(route('suppliers.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('suppliers/index')
            ->has('suppliers.data', 1)
            ->has('summary')
            ->has('statuses'));
});

test('authorized users can register suppliers', function (): void {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'suppliers.create', 'guard_name' => 'web']);
    $actor->givePermissionTo('suppliers.create');

    $this->actingAs($actor)
        ->post(route('suppliers.store'), [
            'supplier_code' => 'SUP-100001',
            'company_name' => 'Northwind Trading',
            'contact_person' => 'Jane Santos',
            'email_address' => 'jane@example.com',
            'phone_number' => '555-1234',
            'address' => '123 Supply Road',
            'tax_identification_number' => '123-456-789-000',
            'status' => 'active',
            'total_orders' => 12,
            'fulfilled_orders' => 10,
            'late_deliveries' => 1,
            'performance_score' => 92.5,
            'last_delivery_at' => '2026-06-01',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('suppliers', [
        'supplier_code' => 'SUP-100001',
        'company_name' => 'Northwind Trading',
        'status' => 'active',
    ]);
});

test('authorized users can maintain supplier records and performance', function (): void {
    $actor = User::factory()->create();
    $supplier = Supplier::factory()->create([
        'supplier_code' => 'SUP-200001',
        'company_name' => 'Old Supplier',
    ]);
    Permission::firstOrCreate(['name' => 'suppliers.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('suppliers.update');

    $this->actingAs($actor)
        ->put(route('suppliers.update', $supplier), [
            'supplier_code' => 'SUP-200001',
            'company_name' => 'Updated Supplier',
            'contact_person' => 'Ramon Cruz',
            'email_address' => 'ramon@example.com',
            'phone_number' => '555-6789',
            'address' => '456 Vendor Avenue',
            'tax_identification_number' => $supplier->tax_identification_number,
            'status' => 'on_hold',
            'total_orders' => 20,
            'fulfilled_orders' => 18,
            'late_deliveries' => 3,
            'performance_score' => 87.25,
            'last_delivery_at' => '2026-06-10',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('suppliers', [
        'id' => $supplier->id,
        'company_name' => 'Updated Supplier',
        'status' => 'on_hold',
        'fulfilled_orders' => 18,
        'late_deliveries' => 3,
    ]);
});

test('supplier performance metrics are validated', function (): void {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'suppliers.create', 'guard_name' => 'web']);
    $actor->givePermissionTo('suppliers.create');

    $this->actingAs($actor)
        ->post(route('suppliers.store'), [
            'supplier_code' => 'SUP-300001',
            'company_name' => 'Metric Supplier',
            'status' => 'active',
            'total_orders' => 5,
            'fulfilled_orders' => 6,
            'late_deliveries' => 0,
        ])
        ->assertSessionHasErrors('fulfilled_orders');
});
