<?php

namespace App\Models;

use Database\Factories\PurchaseRequisitionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequisition extends Model
{
    /** @use HasFactory<PurchaseRequisitionFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CONVERTED = 'converted_to_purchase_order';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_SUBMITTED,
        self::STATUS_APPROVED,
        self::STATUS_REJECTED,
        self::STATUS_CONVERTED,
    ];

    protected $fillable = [
        'requisition_number',
        'requesting_department',
        'purpose',
        'needed_date',
        'requested_by',
        'supervisor_id',
        'purchasing_id',
        'purchase_order_reference',
        'status',
        'estimated_total',
        'remarks',
        'approval_remarks',
        'submitted_at',
        'approved_at',
        'converted_at',
    ];

    protected $attributes = [
        'status' => self::STATUS_DRAFT,
        'estimated_total' => 0,
    ];

    protected function casts(): array
    {
        return [
            'needed_date' => 'date',
            'estimated_total' => 'decimal:2',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'converted_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function purchasingOfficer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purchasing_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseRequisitionLine::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
