<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

test('authorized users can view the user management page', function () {
    $actor = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.view');

    User::factory()->create(['name' => 'Managed User']);

    $this->actingAs($actor)
        ->get(route('users.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('users/index')
            ->has('users.data')
            ->has('roles'));
});

test('authorized users can change a user role', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();
    $role = Role::create(['name' => 'Approver', 'guard_name' => 'web']);

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.update-role', $target), [
            'role' => $role->name,
        ])
        ->assertRedirect();

    expect($target->fresh()->hasRole($role))->toBeTrue();

    $this->assertDatabaseHas('activity_log', [
        'log_name' => 'user-management',
        'description' => 'Changed user role',
        'subject_id' => $target->id,
        'subject_type' => User::class,
    ]);
});

test('authorized users can activate and deactivate users', function () {
    $actor = User::factory()->create();
    $target = User::factory()->create();

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.deactivate', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeFalse();

    $this->actingAs($actor)
        ->patch(route('users.activate', $target))
        ->assertRedirect();

    expect($target->fresh()->is_active)->toBeTrue();
});

test('users cannot deactivate their own account', function () {
    $actor = User::factory()->create();

    Permission::firstOrCreate(['name' => 'users.update', 'guard_name' => 'web']);
    $actor->givePermissionTo('users.update');

    $this->actingAs($actor)
        ->patch(route('users.deactivate', $actor))
        ->assertSessionHasErrors('user');

    expect($actor->fresh()->is_active)->toBeTrue();
});

test('inactive authenticated users are signed out on the next request', function () {
    $user = User::factory()->inactive()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});
