<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\UserRoleChanged;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserManagementService
{
    /**
     * @param  array{search?: string|null, status?: string|null}  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()
            ->select(['id', 'name', 'email', 'username', 'is_active', 'created_at', 'updated_at'])
            ->with(['roles:id,name'])
            ->orderBy('name');

        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if (($filters['status'] ?? null) === 'active') {
            $query->where('is_active', true);
        }

        if (($filters['status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        return $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'is_active' => $user->is_active,
                'is_current_user' => auth()->id() === $user->id,
                'role' => $user->roles->first()?->name,
                'roles' => $user->roles->pluck('name')->values(),
                'created_at' => $user->created_at?->toIso8601String(),
                'updated_at' => $user->updated_at?->toIso8601String(),
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string}>
     */
    public function roles(): Collection
    {
        return Role::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
            ]);
    }

    public function updateRole(User $user, ?string $roleName, User $actor): void
    {
        $oldRoles = $user->roles()->pluck('name')->values()->all();
        $newRoles = $roleName === null ? [] : [$roleName];

        $user->syncRoles($newRoles);

        activity('user-management')
            ->causedBy($actor)
            ->performedOn($user)
            ->withProperties([
                'old_roles' => $oldRoles,
                'new_roles' => $newRoles,
            ])
            ->event('updated')
            ->log('Changed user role');

        // Send notification to the user whose role was changed
        // Wrapped in try-catch to handle cases where Reverb is not running
        try {
            $oldRoleDisplay = ! empty($oldRoles) ? $oldRoles[0] : null;
            $user->notify(new UserRoleChanged($user, $actor, $oldRoleDisplay, $roleName));
        } catch (\Throwable $e) {
            // Log the error but don't fail the role update
            // In production with Reverb running, this won't be an issue
            \Log::warning('Failed to send role change notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function activate(User $user, User $actor): void
    {
        if ($user->is_active) {
            return;
        }

        $user->forceFill(['is_active' => true])->save();

        activity('user-management')
            ->causedBy($actor)
            ->performedOn($user)
            ->withProperties(['is_active' => true])
            ->event('updated')
            ->log('Activated user');
    }

    public function deactivate(User $user, User $actor): void
    {
        if ($user->is($actor)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot deactivate your own account.',
            ]);
        }

        if (! $user->is_active) {
            return;
        }

        $user->forceFill(['is_active' => false])->save();

        activity('user-management')
            ->causedBy($actor)
            ->performedOn($user)
            ->withProperties(['is_active' => false])
            ->event('updated')
            ->log('Deactivated user');
    }
}
