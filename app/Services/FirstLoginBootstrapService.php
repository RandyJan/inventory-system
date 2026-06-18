<?php

namespace App\Services;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class FirstLoginBootstrapService
{
    public function bootstrap(User $user): User
    {
        if ($this->administratorExists()) {
            return $user;
        }

        $administratorRole = Role::findByName('Administrator', 'web');

        $user->forceFill([
            'is_active' => true,
        ])->save();

        $user->assignRole($administratorRole);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user->refresh();
    }

    private function administratorExists(): bool
    {
        return User::query()
            ->role('Administrator')
            ->exists();
    }
}
