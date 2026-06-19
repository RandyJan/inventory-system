<?php

namespace App\Models;

use Database\Factories\InventoryAdjustmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryAdjustment extends Model
{
    /** @use HasFactory<InventoryAdjustmentFactory> */
    use HasFactory, SoftDeletes;

    public const TYPE_INCREASE = 'increase';

    public const TYPE_DECREASE = 'decrease';

    public const TYPE_DAMAGED = 'damaged';

    public const TYPE_LOST = 'lost';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_INCREASE,
        self::TYPE_DECREASE,
        self::TYPE_DAMAGED,
        self::TYPE_LOST,
    ];

    public const REASON_PHYSICAL_COUNT_VARIANCE = 'Physical Count Variance';

    public const REASON_DAMAGE = 'Damage';

    public const REASON_EXPIRED_ITEMS = 'Expired Items';

    public const REASON_THEFT_LOSS = 'Theft/Loss';

    public const REASON_DATA_CORRECTION = 'Data Correction';

    /** @var list<string> */
    public const REASONS = [
        self::REASON_PHYSICAL_COUNT_VARIANCE,
        self::REASON_DAMAGE,
        self::REASON_EXPIRED_ITEMS,
        self::REASON_THEFT_LOSS,
        self::REASON_DATA_CORRECTION,
    ];

    protected $fillable = [
        'adjustment_number',
        'adjustment_type',
        'reason',
        'adjustment_date',
        'adjusted_by',
        'total_quantity_adjusted',
        'remarks',
    ];

    protected $attributes = [
        'total_quantity_adjusted' => 0,
    ];

    protected function casts(): array
    {
        return [
            'adjustment_date' => 'date',
            'total_quantity_adjusted' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InventoryAdjustmentLine::class);
    }
}
