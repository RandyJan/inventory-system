<?php

use App\Models\User;
use App\Services\RoleManagementService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\seed;

uses(RefreshDatabase::class);

test('database seeder creates administrator and guest demo accounts with permissions', function () {
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
