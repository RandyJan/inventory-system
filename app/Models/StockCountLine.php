<?php

namespace App\Models;

use Database\Factories\StockCountLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockCountLine extends Model
{
    /** @use HasFactory<StockCountLineFactory> */
    use HasFactory;

    public const RECOMMENDATION_INCREASE = 'Increase stock';

    public const RECOMMENDATION_DECREASE = 'Decrease stock';

    public const RECOMMENDATION_NONE = 'No adjustment needed';

    protected $fillable = [
        'item_id',
        'system_quantity',
        'actual_quantity',
        'variance_quantity',
        'unit_of_measure',
        'recommendation',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'system_quantity' => 'decimal:2',
            'actual_quantity' => 'decimal:2',
            'variance_quantity' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(StockCount::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
