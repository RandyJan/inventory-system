<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WarehouseLocation extends Model
{
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    public const TYPES = ['building', 'room', 'stockroom', 'aisle', 'rack', 'shelf', 'bin'];

    protected $fillable = [
        'warehouse_id',
        'parent_id',
        'location_code',
        'name',
        'type',
        'building',
        'floor',
        'room',
        'rack',
        'shelf',
        'bin',
        'capacity',
        'used_capacity',
        'is_active',
        'notes',
    ];

    protected $attributes = [
        'type' => 'stockroom',
        'capacity' => 0,
        'used_capacity' => 0,
        'is_active' => true,
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'decimal:2',
            'used_capacity' => 'decimal:2',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'warehouse_location_id');
    }
}
