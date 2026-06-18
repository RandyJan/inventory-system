<?php

namespace App\Models;

use Database\Factories\StockIssuanceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockIssuance extends Model
{
    /** @use HasFactory<StockIssuanceFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'issue_number',
        'requesting_department',
        'requestor',
        'date_issued',
        'released_by',
        'total_quantity_issued',
    ];

    protected $attributes = [
        'total_quantity_issued' => 0,
    ];

    protected function casts(): array
    {
        return [
            'date_issued' => 'date',
            'total_quantity_issued' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function releaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockIssuanceLine::class);
    }
}
