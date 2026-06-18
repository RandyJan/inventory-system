<?php

namespace App\Models;

use Database\Factories\PurchaseRequisitionLineFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequisitionLine extends Model
{
    /** @use HasFactory<PurchaseRequisitionLineFactory> */
    use HasFactory;

    protected $fillable = [
        'purchase_requisition_id',
        'item_id',
        'item_description',
        'quantity_requested',
        'unit_of_measure',
        'estimated_unit_cost',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'decimal:2',
            'estimated_unit_cost' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function purchaseRequisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
