<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalWorkflowStep extends Model
{
    /** @use HasFactory<\Database\Factories\ApprovalWorkflowStepFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'approval_workflow_id',
        'level',
        'name',
        'role_name',
        'permission_name',
        'is_required',
    ];

    protected $attributes = [
        'is_required' => true,
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'is_required' => 'boolean',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'approval_workflow_id');
    }
}
