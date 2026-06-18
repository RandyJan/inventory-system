<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionManagementService
{
    /**
     * @return Collection<int, array{id: int, name: string, guard_name: string, module: string, roles_count: int, users_count: int, created_at: string|null, updated_at: string|null}>
     */
    public function permissions(): Collection
    {
        $permissionsTable = (new Permission)->getTable();
        $roleHasPermissionsTable = config('permission.table_names.role_has_permissions');
        $modelHasPermissionsTable = config('permission.table_names.model_has_permissions');
        $permissionPivotKey = config('permission.column_names.permission_pivot_key') ?? 'permission_id';

        return Permission::query()
            ->select("{$permissionsTable}.*")
            ->selectSub(
                DB::table($roleHasPermissionsTable)
                    ->selectRaw('count(*)')
                    ->whereColumn("{$roleHasPermissionsTable}.{$permissionPivotKey}", "{$permissionsTable}.id"),
                'roles_count'
            )
            ->selectSub(
                DB::table($modelHasPermissionsTable)
                    ->selectRaw('count(*)')
                    ->whereColumn("{$modelHasPermissionsTable}.{$permissionPivotKey}", "{$permissionsTable}.id")
                    ->where('model_type', User::class),
                'users_count'
            )
            ->where('guard_name', $this->guardName())
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission): array => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'module' => str($permission->name)->before('.')->toString(),
                'roles_count' => (int) $permission->roles_count,
                'users_count' => (int) $permission->users_count,
                'created_at' => $permission->created_at?->toIso8601String(),
                'updated_at' => $permission->updated_at?->toIso8601String(),
            ]);
    }

    /**
     * @param  array{name: string}  $data
     */
    public function create(array $data, User $actor): Permission
    {
        $permission = Permission::create([
            'name' => $data['name'],
            'guard_name' => $this->guardName(),
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        activity('permission-management')
            ->causedBy($actor)
            ->performedOn($permission)
            ->event('created')
            ->log('Created permission');

        return $permission;
    }

    /**
     * @param  array{name: string}  $data
     */
    public function update(Permission $permission, array $data, User $actor): Permission
    {
        $oldName = $permission->name;

        $permission->forceFill(['name' => $data['name']])->save();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        activity('permission-management')
            ->causedBy($actor)
            ->performedOn($permission)
            ->withProperties([
                'old_name' => $oldName,
                'new_name' => $permission->name,
            ])
            ->event('updated')
            ->log('Updated permission');

        return $permission;
    }

    public function delete(Permission $permission, User $actor): void
    {
        if ($permission->roles()->exists() || $permission->users()->exists()) {
            throw ValidationException::withMessages([
                'permission' => 'Remove this permission from roles and users before deleting it.',
            ]);
        }

        activity('permission-management')
            ->causedBy($actor)
            ->performedOn($permission)
            ->withProperties(['name' => $permission->name])
            ->event('deleted')
            ->log('Deleted permission');

        $permission->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function guardName(): string
    {
        return (string) config('auth.defaults.guard', 'web');
    }
}
