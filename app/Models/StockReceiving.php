<?php

namespace App\Models;

use Database\Factories\StockReceivingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockReceiving extends Model
{
    /** @use HasFactory<StockReceivingFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'receiving_number',
        'supplier_id',
        'delivery_date',
        'purchase_order_reference',
        'received_by',
        'total_quantity_received',
        'remarks',
    ];

    protected $attributes = [
        'total_quantity_received' => 0,
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'total_quantity_received' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockReceivingLine::class);
    }
}
