<?php

namespace App\Models;

use Database\Factories\InventoryAdjustmentLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustmentLine extends Model
{
    /** @use HasFactory<InventoryAdjustmentLineFactory> */
    use HasFactory;

    protected $fillable = [
        'item_id',
        'quantity_adjusted',
        'quantity_before',
        'quantity_after',
        'unit_of_measure',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_adjusted' => 'decimal:2',
            'quantity_before' => 'decimal:2',
            'quantity_after' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(InventoryAdjustment::class, 'inventory_adjustment_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
