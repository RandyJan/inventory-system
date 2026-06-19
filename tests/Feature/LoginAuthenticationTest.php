<?php

use App\Models\User;
use App\Services\Auth\LoginAuthenticationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Administrator', 'guard_name' => 'web'])
        ->givePermissionTo('dashboard.view');
});

test('database password fallback authenticates a local user when ldap fails', function () {
    $user = User::factory()->create([
        'username' => 'local.user',
        'password' => Hash::make('local-password'),
    ]);

    Auth::shouldReceive('attempt')
        ->once()
        ->with([
            'samaccountname' => 'local.user',
            'password' => 'local-password',
        ])
        ->andReturn(false);

    $authenticatedUser = app(LoginAuthenticationService::class)->authenticate(
        username: 'local.user',
        password: 'local-password',
        usernameField: 'samaccountname',
    );

    expect($authenticatedUser->is($user))->toBeTrue();
});

test('database password fallback can authenticate a local user by email', function () {
    $user = User::factory()->create([
        'email' => 'local@example.test',
        'password' => Hash::make('local-password'),
    ]);

    Auth::shouldReceive('attempt')
        ->once()
        ->with([
            'samaccountname' => 'local@example.test',
            'password' => 'local-password',
        ])
        ->andReturn(false);

    $authenticatedUser = app(LoginAuthenticationService::class)->authenticate(
        username: 'local@example.test',
        password: 'local-password',
        usernameField: 'samaccountname',
    );

    expect($authenticatedUser->is($user))->toBeTrue();
});

test('database password fallback still works when ldap server cannot be contacted', function () {
    $user = User::factory()->create([
        'email' => 'local.admin@example.test',
        'password' => Hash::make('password'),
    ]);

    Auth::shouldReceive('attempt')
        ->once()
        ->with([
            'samaccountname' => 'local.admin@example.test',
            'password' => 'password',
        ])
        ->andThrow(new RuntimeException("Can't contact LDAP server"));

    Log::shouldReceive('warning')
        ->once()
        ->withArgs(fn (string $message, array $context): bool => $message === 'LDAP authentication attempt failed; falling back to database authentication.'
            && $context['username'] === 'local.admin@example.test'
            && $context['message'] === "Can't contact LDAP server");

    $authenticatedUser = app(LoginAuthenticationService::class)->authenticate(
        username: 'local.admin@example.test',
        password: 'password',
        usernameField: 'samaccountname',
    );

    expect($authenticatedUser->is($user))->toBeTrue();
});

test('database password fallback rejects invalid local passwords', function () {
    User::factory()->create([
        'username' => 'local.user',
        'password' => Hash::make('local-password'),
    ]);

    Auth::shouldReceive('attempt')
        ->once()
        ->with([
            'samaccountname' => 'local.user',
            'password' => 'wrong-password',
        ])
        ->andReturn(false);

    $authenticatedUser = app(LoginAuthenticationService::class)->authenticate(
        username: 'local.user',
        password: 'wrong-password',
        usernameField: 'samaccountname',
    );

    expect($authenticatedUser)->toBeNull();
});

test('database password fallback blocks inactive local users', function () {
    $administrator = User::factory()->create();
    $administrator->assignRole('Administrator');

    User::factory()->inactive()->create([
        'username' => 'inactive.user',
        'password' => Hash::make('local-password'),
    ]);

    Auth::shouldReceive('attempt')
        ->once()
        ->with([
            'samaccountname' => 'inactive.user',
            'password' => 'local-password',
        ])
        ->andReturn(false);

    Auth::shouldReceive('logout')->once();

    app(LoginAuthenticationService::class)->authenticate(
        username: 'inactive.user',
        password: 'local-password',
        usernameField: 'samaccountname',
    );
})->throws(ValidationException::class);
