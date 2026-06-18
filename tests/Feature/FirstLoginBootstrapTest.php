<?php

use App\Models\User;
use App\Services\FirstLoginBootstrapService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web'])
        ->givePermissionTo('dashboard.view');
});

test('the first authenticated user is activated and bootstrapped as administrator', function () {
    $user = User::factory()->inactive()->create();

    app(FirstLoginBootstrapService::class)->bootstrap($user);

    expect($user->fresh()->is_active)->toBeTrue()
        ->and($user->fresh()->hasRole('Administrator'))->toBeTrue();
});

test('a later user is not auto promoted when an administrator already exists', function () {
    $administrator = User::factory()->create();
    $administrator->assignRole('Administrator');

    $user = User::factory()->inactive()->create();

    app(FirstLoginBootstrapService::class)->bootstrap($user);

    expect($user->fresh()->is_active)->toBeFalse()
        ->and($user->fresh()->hasRole('Administrator'))->toBeFalse();
});
