<?php

namespace Database\Seeders;

use App\Models\ApprovalWorkflow;
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
        $administratorRole = Role::firstOrCreate([
            'name' => 'Administrator',
            'guard_name' => 'web',
        ]);

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

        $supervisorRole = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
        ]);

        $auditorRole = Role::firstOrCreate([
            'name' => 'Auditor/View-Only User',
            'guard_name' => 'web',
        ]);

        $guestRole = Role::firstOrCreate([
            'name' => 'Guest',
            'guard_name' => 'web',
        ]);

        // Assign permissions

        // Full access
        $administratorRole->syncPermissions($permissions);
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
                str_contains($permission->name, 'requisition') ||
                $permission->name === 'stock-transfers.approve.department-head'
            )->values()
        );

        $supervisorRole->syncPermissions(
            $permissions->filter(fn ($permission) => $permission->name === 'dashboard.view' ||
                $permission->name === 'stock-transfers.view' ||
                $permission->name === 'stock-transfers.approve.supervisor'
            )->values()
        );

        $auditorRole->syncPermissions(
            $permissions->filter(fn ($permission) => str_contains($permission->name, '.view') ||
                str_contains($permission->name, '.read')
            )->values()
        );

        $guestRole->syncPermissions(
            $permissions->filter(fn ($permission) => $permission->name === 'dashboard.view')->values()
        );

        $this->seedApprovalWorkflow();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function seedApprovalWorkflow(): void
    {
        $workflow = ApprovalWorkflow::firstOrCreate(
            ['workflow_type' => ApprovalWorkflow::TYPE_STOCK_TRANSFER],
            [
                'name' => 'Stock Transfer Approval',
                'description' => 'Request > Supervisor > Department Head > Inventory Manager',
                'is_active' => true,
            ]
        );

        $workflow->steps()->delete();
        collect([
            [
                'name' => 'Supervisor',
                'role_name' => 'Supervisor',
                'permission_name' => 'stock-transfers.approve.supervisor',
            ],
            [
                'name' => 'Department Head',
                'role_name' => 'Department Head',
                'permission_name' => 'stock-transfers.approve.department-head',
            ],
            [
                'name' => 'Inventory Manager',
                'role_name' => 'Inventory Manager',
                'permission_name' => 'stock-transfers.approve.inventory-manager',
            ],
        ])->each(function (array $step, int $index) use ($workflow): void {
            $workflow->steps()->create([
                'level' => $index + 1,
                ...$step,
            ]);
        });
    }
}
