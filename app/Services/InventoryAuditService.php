<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class InventoryAuditService
{
    /**
     * @param  array<string, mixed>  $oldValues
     * @param  array<string, mixed>  $newValues
     * @param  array<string, mixed>  $context
     */
    public function record(
        Model $subject,
        User $actor,
        string $action,
        string $description,
        array $oldValues,
        array $newValues,
        array $context = []
    ): void {
        activity('inventory-tracking')
            ->causedBy($actor)
            ->performedOn($subject)
            ->withProperties([
                'action' => $action,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'context' => $context,
            ])
            ->event($action)
            ->log($description);
    }
}
