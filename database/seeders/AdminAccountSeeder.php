<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AdminAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! config('auth.seeded_admin.enabled')) {
            return;
        }

        $roleName = (string) config('auth.seeded_admin.role', 'Administrator');

        if (! Role::query()->where('name', $roleName)->where('guard_name', 'web')->exists()) {
            $this->call(RbacSeeder::class);
        }

        $role = Role::findByName($roleName, 'web');

        $administrator = User::query()->firstOrNew([
            'username' => (string) config('auth.seeded_admin.username'),
        ]);

        $administrator->forceFill([
            'name' => (string) config('auth.seeded_admin.name'),
            'email' => (string) config('auth.seeded_admin.email'),
            'is_active' => true,
        ]);

        if (! $administrator->exists) {
            $administrator->password = (string) config('auth.seeded_admin.password');
        }

        $administrator->save();

        $administrator->syncRoles([$role]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
