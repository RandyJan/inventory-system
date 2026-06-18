<?php

namespace Database\Seeders;

use App\Services\RoleManagementService;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect(RoleManagementService::DEFAULT_PERMISSIONS)
            ->map(fn (string $permissionName): Permission => Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
            ]));

        // Create roles
        $systemAdministratorRole = Role::firstOrCreate([
            'name' => 'System Administrator',
            'guard_name' => 'web',
        ]);

        $inventoryManagerRole = Role::firstOrCreate([
            'name' => 'Inventory Manager',
            'guard_name' => 'web',
        ]);

        $warehouseStaffRole = Role::firstOrCreate([
            'name' => 'Warehouse Staff',
            'guard_name' => 'web',
        ]);

        $purchasingOfficerRole = Role::firstOrCreate([
            'name' => 'Purchasing Officer',
            'guard_name' => 'web',
        ]);

        $departmentHeadRole = Role::firstOrCreate([
            'name' => 'Department Head',
            'guard_name' => 'web',
        ]);

        $auditorRole = Role::firstOrCreate([
            'name' => 'Auditor/View-Only User',
            'guard_name' => 'web',
        ]);

        // Assign permissions

        // Full access
        $systemAdministratorRole->syncPermissions($permissions);

        // For now, give all permissions.
        // Replace these with specific permissions later.
        $inventoryManagerRole->syncPermissions($permissions);

        $warehouseStaffRole->syncPermissions(
            $permissions->filter(fn ($permission) => str_contains($permission->name, 'inventory') ||
                str_contains($permission->name, 'stock') ||
                str_contains($permission->name, 'items') ||
                str_contains($permission->name, 'warehouse')
            )->values()
        );

        $purchasingOfficerRole->syncPermissions(
            $permissions->filter(fn ($permission) => str_contains($permission->name, 'purchase') ||
                str_contains($permission->name, 'supplier')
            )->values()
        );

        $departmentHeadRole->syncPermissions(
            $permissions->filter(fn ($permission) => str_contains($permission->name, 'request') ||
                str_contains($permission->name, 'approval') ||
                str_contains($permission->name, 'requisition')
            )->values()
        );

        $auditorRole->syncPermissions(
            $permissions->filter(fn ($permission) => str_contains($permission->name, '.view') ||
                str_contains($permission->name, '.read')
            )->values()
        );

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
