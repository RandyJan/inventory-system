<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class AuditService
{
    public function list(array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        $query = Activity::query()->with(['causer'])->orderByDesc('created_at');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['causer_id'])) {
            $query->where('causer_id', $filters['causer_id']);
        }

        if (! empty($filters['type'])) {
            if ($filters['type'] === 'login') {
                $query->where(function ($q) {
                    $q->where('event', 'login')
                        ->orWhere('description', 'like', '%logged in%');
                });
            }

            if ($filters['type'] === 'logout') {
                $query->where(function ($q) {
                    $q->where('event', 'logout')
                        ->orWhere('description', 'like', '%logged out%');
                });
            }

            if ($filters['type'] === 'authentication') {
                $query->where('log_name', 'authentication');
            }

            if ($filters['type'] === 'user-management') {
                $query->where('log_name', 'user-management');
            }

            if ($filters['type'] === 'role-management') {
                $query->where('log_name', 'role-management');
            }
        }

        return $query->paginate($perPage)->appends(request()->query());
    }

    public function find(int $id): ?Activity
    {
        return Activity::with(['causer', 'subject'])->find($id);
    }
}
