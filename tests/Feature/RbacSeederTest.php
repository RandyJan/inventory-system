<?php

use App\Models\User;
use App\Services\RoleManagementService;
use Database\Seeders\AdminAccountSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\seed;

uses(RefreshDatabase::class);

test('database seeder creates roles with expected permissions', function () {
    seed(DatabaseSeeder::class);

    /** @var User $administrator */
    $administrator = User::factory()->create();
    /** @var User $guest */
    $guest = User::factory()->create();

    $administrator->assignRole('Administrator');
    $guest->assignRole('Guest');

    expect($administrator->hasRole('Administrator'))->toBeTrue()
        ->and($guest->hasRole('Guest'))->toBeTrue()
        ->and($administrator->can('dashboard.view'))->toBeTrue()
        ->and($guest->can('dashboard.view'))->toBeTrue()
        ->and($guest->can('users.view'))->toBeFalse();

    $administratorRole = Role::findByName('Administrator');
    $guestRole = Role::findByName('Guest');

    expect($administratorRole->permissions->pluck('name')->sort()->values()->all())->toBe(
        collect(RoleManagementService::DEFAULT_PERMISSIONS)->sort()->values()->all()
    )->and($guestRole->permissions->pluck('name')->all())->toBe([
        'dashboard.view',
    ]);
});

test('database seeder creates a local administrator account for non ldap login', function () {
    seed(DatabaseSeeder::class);

    /** @var User $administrator */
    $administrator = User::query()
        ->where('username', 'local.admin')
        ->firstOrFail();

    expect($administrator->name)->toBe('Local Administrator')
        ->and($administrator->email)->toBe('local.admin@example.test')
        ->and($administrator->is_active)->toBeTrue()
        ->and(Hash::check('password', $administrator->getAuthPassword()))->toBeTrue()
        ->and($administrator->hasRole('Administrator'))->toBeTrue()
        ->and($administrator->can('users.view'))->toBeTrue();
});

test('admin account seeder can be run directly', function () {
    seed(AdminAccountSeeder::class);

    /** @var User $administrator */
    $administrator = User::query()
        ->where('username', 'local.admin')
        ->firstOrFail();

    expect($administrator->hasRole('Administrator'))->toBeTrue()
        ->and($administrator->can('dashboard.view'))->toBeTrue();
});

test('seeded guest users can access the dashboard', function () {
    seed(DatabaseSeeder::class);

    /** @var User $guest */
    $guest = User::factory()->create();
    $guest->assignRole('Guest');

    actingAs($guest)
        ->get(route('dashboard'))
        ->assertSuccessful();
});

test('users without the dashboard permission are forbidden from the dashboard', function () {
    /** @var User $user */
    $user = User::factory()->create();

    actingAs($user)
        ->get(route('dashboard'))
        ->assertForbidden();
});
