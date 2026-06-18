<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view permission management', function (): void {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'permissions.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'items.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('permissions.view');

    $this->actingAs($actor)
        ->get(route('permissions.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('permissions/index')
            ->has('permissions'));
});

test('authorized users can create permissions', function (): void {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'permissions.create', 'guard_name' => 'web']);
    $actor->givePermissionTo('permissions.create');

    $this->actingAs($actor)
        ->post(route('permissions.store'), [
            'name' => 'reports.export',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('permissions', [
        'name' => 'reports.export',
        'guard_name' => 'web',
    ]);
});

test('authorized users can update permissions', function (): void {
    $actor = User::factory()->create();
    $permission = Permission::firstOrCreate(['name' => 'reports.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'permissions.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('permissions.update');

    $this->actingAs($actor)
        ->put(route('permissions.update', $permission), [
            'name' => 'reports.read',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('permissions', [
        'id' => $permission->id,
        'name' => 'reports.read',
    ]);
});

test('assigned permissions cannot be deleted', function (): void {
    $actor = User::factory()->create();
    $role = Role::create(['name' => 'Report Viewer', 'guard_name' => 'web']);
    $permission = Permission::firstOrCreate(['name' => 'reports.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'permissions.delete', 'guard_name' => 'web']);
    $actor->givePermissionTo('permissions.delete');
    $role->givePermissionTo($permission);

    $this->actingAs($actor)
        ->delete(route('permissions.destroy', $permission))
        ->assertSessionHasErrors('permission');

    $this->assertModelExists($permission);
});

test('unassigned permissions can be deleted', function (): void {
    $actor = User::factory()->create();
    $permission = Permission::firstOrCreate(['name' => 'temporary.access', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'permissions.delete', 'guard_name' => 'web']);
    $actor->givePermissionTo('permissions.delete');

    $this->actingAs($actor)
        ->delete(route('permissions.destroy', $permission))
        ->assertRedirect();

    $this->assertModelMissing($permission);
});
