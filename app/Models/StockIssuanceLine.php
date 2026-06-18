<?php

namespace App\Models;

use Database\Factories\StockIssuanceLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockIssuanceLine extends Model
{
    /** @use HasFactory<StockIssuanceLineFactory> */
    use HasFactory;

    protected $fillable = [
        'stock_issuance_id',
        'item_id',
        'quantity_issued',
        'unit_of_measure',
    ];

    protected function casts(): array
    {
        return [
            'quantity_issued' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function stockIssuance(): BelongsTo
    {
        return $this->belongsTo(StockIssuance::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
