<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view the role management page', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'roles.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('roles.view');

    Role::create(['name' => 'Viewer', 'guard_name' => 'web']);

    $this->actingAs($actor)
        ->get(route('roles.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('roles/index')
            ->has('roles')
            ->has('permissions'));
});

test('authorized users can create roles with existing and new permissions', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'roles.create', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('roles.create');

    $this->actingAs($actor)
        ->post(route('roles.store'), [
            'name' => 'Records Officer',
            'permissions' => ['users.view'],
            'new_permissions' => "records.view\nrecords.export",
        ])
        ->assertRedirect();

    $role = Role::findByName('Records Officer');

    expect($role->permissions->pluck('name')->sort()->values()->all())->toBe([
        'records.export',
        'records.view',
        'users.view',
    ]);

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'role-management',
        'description' => 'Created role',
        'subject_id' => $role->id,
        'subject_type' => Role::class,
    ]);
});

test('authorized users can update role permissions dynamically', function () {
    $actor = User::factory()->create();
    $role = Role::create(['name' => 'Supervisor', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'roles.update', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
    Permission::firstOrCreate(['name' => 'audits.view', 'guard_name' => 'web']);
    $role->givePermissionTo('audits.view');
    $actor->givePermissionTo('roles.update');

    $this->actingAs($actor)
        ->put(route('roles.update', $role), [
            'name' => 'Team Supervisor',
            'permissions' => ['users.view'],
            'new_permissions' => 'roles.view',
        ])
        ->assertRedirect();

    $role->refresh();

    expect($role->name)->toBe('Team Supervisor')
        ->and($role->permissions->pluck('name')->sort()->values()->all())->toBe([
            'roles.view',
            'users.view',
        ]);
});

test('assigned roles cannot be deleted', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();
    $role = Role::create(['name' => 'Assigned Role', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'roles.delete', 'guard_name' => 'web']);
    $actor->givePermissionTo('roles.delete');
    $target->assignRole($role);

    $this->actingAs($actor)
        ->delete(route('roles.destroy', $role))
        ->assertSessionHasErrors('role');

    $this->assertModelExists($role);
});

test('unassigned roles can be deleted', function () {
    $actor = User::factory()->create();
    $role = Role::create(['name' => 'Temporary Role', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'roles.delete', 'guard_name' => 'web']);
    $actor->givePermissionTo('roles.delete');

    $this->actingAs($actor)
        ->delete(route('roles.destroy', $role))
        ->assertRedirect();

    $this->assertModelMissing($role);
});
