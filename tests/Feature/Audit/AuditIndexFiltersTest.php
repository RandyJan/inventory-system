<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'audits.view', 'guard_name' => 'web']);
});

test('audit index can filter by login events', function () {
    $actor = User::factory()->create();
    $actor->givePermissionTo('audits.view');

    activity('authentication')
        ->causedBy($actor)
        ->event('login')
        ->log('User logged in');

    activity('user-management')
        ->causedBy($actor)
        ->event('updated')
        ->log('Changed user role');

    $this->actingAs($actor)
        ->get(route('audits.index', ['type' => 'login']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('audit/index')
            ->where('filters.type', 'login')
            ->has('activities.data', 1)
            ->where('activities.data.0.description', 'User logged in'));
});

test('audit index can filter by role management events', function () {
    $actor = User::factory()->create();
    $actor->givePermissionTo('audits.view');

    activity('authentication')
        ->causedBy($actor)
        ->event('logout')
        ->log('User logged out');

    activity('role-management')
        ->causedBy($actor)
        ->event('updated')
        ->log('Updated role');

    $this->actingAs($actor)
        ->get(route('audits.index', ['type' => 'role-management']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('audit/index')
            ->where('filters.type', 'role-management')
            ->has('activities.data', 1)
            ->where('activities.data.0.log_name', 'role-management'));
});
