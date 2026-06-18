<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'item_code',
        'barcode',
        'name',
        'description',
        'category',
        'subcategory',
        'category_id',
        'subcategory_id',
        'warehouse_id',
        'warehouse_location_id',
        'quantity_on_hand',
        'unit_of_measure',
        'brand',
        'manufacturer',
        'reorder_level',
        'maximum_stock_level',
        'minimum_stock_level',
        'standard_cost',
        'selling_price',
        'image_path',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'reorder_level' => 'decimal:2',
            'maximum_stock_level' => 'decimal:2',
            'minimum_stock_level' => 'decimal:2',
            'quantity_on_hand' => 'decimal:2',
            'standard_cost' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'is_archived' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function inventoryCategory(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function inventorySubcategory(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'subcategory_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation(): BelongsTo
    {
        return $this->belongsTo(WarehouseLocation::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where('item_code', 'like', "%{$search}%")
            ->orWhere('name', 'like', "%{$search}%")
            ->orWhere('barcode', 'like', "%{$search}%");
    }
}
