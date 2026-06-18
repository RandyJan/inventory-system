<?php

namespace App\Models;

use Database\Factories\StockReceivingLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReceivingLine extends Model
{
    /** @use HasFactory<StockReceivingLineFactory> */
    use HasFactory;

    protected $fillable = [
        'stock_receiving_id',
        'item_id',
        'quantity_received',
        'unit_of_measure',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_received' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function stockReceiving(): BelongsTo
    {
        return $this->belongsTo(StockReceiving::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
