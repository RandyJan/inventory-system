<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleManagementService
{
    /** @var list<string> */
    public const DEFAULT_PERMISSIONS = [
        'dashboard.view',
        'reports.view',
        'items.view',
        'items.create',
        'items.update',
        'items.delete',
        'inventory-categories.view',
        'inventory-categories.create',
        'inventory-categories.update',
        'users.view',
        'users.update',
        'roles.view',
        'roles.create',
        'roles.update',
        'roles.delete',
        'permissions.view',
        'permissions.create',
        'permissions.update',
        'permissions.delete',
        'approval-workflows.view',
        'approval-workflows.manage',
        'suppliers.view',
        'suppliers.create',
        'suppliers.update',
        'purchase-requisitions.view',
        'purchase-requisitions.create',
        'purchase-requisitions.submit',
        'purchase-requisitions.approve',
        'purchase-requisitions.convert',
        'purchase-orders.view',
        'purchase-orders.create',
        'purchase-orders.submit',
        'purchase-orders.approve',
        'stock-receivings.view',
        'stock-receivings.create',
        'stock-issuances.view',
        'stock-issuances.create',
        'stock-transfers.view',
        'stock-transfers.create',
        'stock-transfers.approve',
        'stock-transfers.approve.supervisor',
        'stock-transfers.approve.department-head',
        'stock-transfers.approve.inventory-manager',
        'inventory-adjustments.view',
        'inventory-adjustments.create',
        'stock-counts.view',
        'stock-counts.create',
        'warehouses.view',
        'warehouses.create',
        'warehouses.update',
        'warehouses.permissions',
        'audits.view',
    ];

    /**
     * @return Collection<int, array{id: int, name: string, permissions: Collection<int, string>, users_count: int, created_at: string|null, updated_at: string|null}>
     */
    public function roles(): Collection
    {
        $rolesTable = (new Role)->getTable();
        $modelHasRolesTable = config('permission.table_names.model_has_roles');
        $rolePivotKey = config('permission.column_names.role_pivot_key') ?? 'role_id';

        return Role::query()
            ->with(['permissions:id,name'])
            ->select("{$rolesTable}.*")
            ->selectSub(
                DB::table($modelHasRolesTable)
                    ->selectRaw('count(*)')
                    ->whereColumn("{$modelHasRolesTable}.{$rolePivotKey}", "{$rolesTable}.id")
                    ->where('model_type', User::class),
                'users_count'
            )
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->pluck('name')->sort()->values(),
                'users_count' => (int) $role->users_count,
                'created_at' => $role->created_at?->toIso8601String(),
                'updated_at' => $role->updated_at?->toIso8601String(),
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string}>
     */
    public function permissions(): Collection
    {
        return Permission::query()
            ->where('guard_name', $this->guardName())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Permission $permission): array => [
                'id' => $permission->id,
                'name' => $permission->name,
            ]);
    }

    /**
     * @param  array{name: string, permissions?: list<string>, new_permissions?: string|null}  $data
     */
    public function create(array $data, User $actor): Role
    {
        $role = Role::create([
            'name' => $data['name'],
            'guard_name' => $this->guardName(),
        ]);

        $permissions = $this->permissionsFromRequest(
            $data['permissions'] ?? [],
            $data['new_permissions'] ?? null
        );

        $role->syncPermissions($permissions);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        activity('role-management')
            ->causedBy($actor)
            ->performedOn($role)
            ->withProperties([
                'permissions' => $permissions->pluck('name')->values(),
            ])
            ->event('created')
            ->log('Created role');

        return $role;
    }

    /**
     * @param  array{name: string, permissions?: list<string>, new_permissions?: string|null}  $data
     */
    public function update(Role $role, array $data, User $actor): Role
    {
        $oldName = $role->name;
        $oldPermissions = $role->permissions()->pluck('name')->values();

        $role->forceFill(['name' => $data['name']])->save();

        $permissions = $this->permissionsFromRequest(
            $data['permissions'] ?? [],
            $data['new_permissions'] ?? null
        );

        $role->syncPermissions($permissions);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        activity('role-management')
            ->causedBy($actor)
            ->performedOn($role)
            ->withProperties([
                'old_name' => $oldName,
                'new_name' => $role->name,
                'old_permissions' => $oldPermissions,
                'new_permissions' => $permissions->pluck('name')->values(),
            ])
            ->event('updated')
            ->log('Updated role');

        return $role;
    }

    public function delete(Role $role, User $actor): void
    {
        if ($role->name === 'Administrator') {
            throw ValidationException::withMessages([
                'role' => 'The Administrator role cannot be deleted.',
            ]);
        }

        if ((int) $role->users()->count() > 0) {
            throw ValidationException::withMessages([
                'role' => 'Remove this role from users before deleting it.',
            ]);
        }

        $properties = [
            'name' => $role->name,
            'permissions' => $role->permissions()->pluck('name')->values(),
        ];

        activity('role-management')
            ->causedBy($actor)
            ->performedOn($role)
            ->withProperties($properties)
            ->event('deleted')
            ->log('Deleted role');

        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @param  list<string>  $permissionNames
     * @return Collection<int, Permission>
     */
    private function permissionsFromRequest(array $permissionNames, ?string $newPermissions): Collection
    {
        return collect($permissionNames)
            ->merge($this->parseNewPermissionNames($newPermissions))
            ->map(fn (mixed $permissionName): string => trim((string) $permissionName))
            ->filter()
            ->unique()
            ->values()
            ->map(fn (string $permissionName): Permission => Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => $this->guardName(),
            ]));
    }

    /**
     * @return list<string>
     */
    private function parseNewPermissionNames(?string $newPermissions): array
    {
        $permissionNames = preg_split('/[\r\n,]+/', (string) $newPermissions, -1, PREG_SPLIT_NO_EMPTY);

        if ($permissionNames === false) {
            return [];
        }

        return collect($permissionNames)
            ->map(fn (string $permissionName): string => trim($permissionName))
            ->filter()
            ->values()
            ->all();
    }

    private function guardName(): string
    {
        return (string) config('auth.defaults.guard', 'web');
    }
}
