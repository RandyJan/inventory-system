<?php

namespace App\Services;

use App\Models\User;

class NotificationService
{
    public function latest(User $user)
    {
        return $user->notifications()
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($n) => $this->format($n));
    }

    public function all(User $user)
    {
        return $user->notifications()
            ->latest()
            ->paginate(15)
            ->through(fn ($n) => $this->format($n));
    }

    private function format($n): array
    {
        return [
            'id' => $n->id,
            'type' => $this->mapType($n),
            'old_role' => $n->data['old_role'] ?? null,
            'new_role' => $n->data['new_role'] ?? null,
            'changed_by' => $n->data['changed_by'] ?? null,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at->toIso8601String(),
        ];
    }

    private function mapType($n): string
    {
        if (str_contains($n->type, 'UserRoleChanged')) {
            return 'role_changed';
        }

        return 'general';
    }
}