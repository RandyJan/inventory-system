<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    /** @var list<string> */
    public const TYPES = ['warehouse', 'building', 'campus', 'stockroom', 'department'];

    protected $fillable = [
        'warehouse_code',
        'name',
        'type',
        'manager_id',
        'campus',
        'building',
        'address',
        'capacity',
        'used_capacity',
        'is_active',
        'notes',
    ];

    protected $attributes = [
        'type' => 'warehouse',
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

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function permittedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'warehouse_user_permissions')
            ->withPivot(['can_view', 'can_receive', 'can_transfer', 'can_adjust'])
            ->withTimestamps();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
