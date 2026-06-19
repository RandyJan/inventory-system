<?php

namespace App\Models;

use Database\Factories\StockCountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockCount extends Model
{
    /** @use HasFactory<StockCountFactory> */
    use HasFactory, SoftDeletes;

    public const TYPE_CYCLE = 'cycle';

    public const TYPE_ANNUAL = 'annual';

    /** @var list<string> */
    public const TYPES = [
        self::TYPE_CYCLE,
        self::TYPE_ANNUAL,
    ];

    protected $fillable = [
        'count_number',
        'count_type',
        'count_date',
        'counted_by',
        'total_items_counted',
        'variance_items_count',
        'total_absolute_variance',
        'remarks',
    ];

    protected $attributes = [
        'total_items_counted' => 0,
        'variance_items_count' => 0,
        'total_absolute_variance' => 0,
    ];

    protected function casts(): array
    {
        return [
            'count_date' => 'date',
            'total_absolute_variance' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function counter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockCountLine::class);
    }
}
