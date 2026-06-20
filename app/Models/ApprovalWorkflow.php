<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalWorkflow extends Model
{
    /** @use HasFactory<\Database\Factories\ApprovalWorkflowFactory> */
    use HasFactory;

    public const TYPE_STOCK_TRANSFER = 'stock_transfer';

    /** @var list<string> */
    protected $fillable = [
        'name',
        'workflow_type',
        'description',
        'is_active',
    ];

    protected $attributes = [
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function steps(): HasMany
    {
        return $this->hasMany(ApprovalWorkflowStep::class)->orderBy('level');
    }
}
