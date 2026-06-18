<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_ON_HOLD = 'on_hold';

    public const STATUS_BLACKLISTED = 'blacklisted';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_ON_HOLD,
        self::STATUS_BLACKLISTED,
    ];

    protected $fillable = [
        'supplier_code',
        'company_name',
        'contact_person',
        'email_address',
        'phone_number',
        'address',
        'tax_identification_number',
        'status',
        'total_orders',
        'fulfilled_orders',
        'late_deliveries',
        'performance_score',
        'last_delivery_at',
    ];

    protected $attributes = [
        'status' => self::STATUS_ACTIVE,
        'total_orders' => 0,
        'fulfilled_orders' => 0,
        'late_deliveries' => 0,
    ];

    protected function casts(): array
    {
        return [
            'total_orders' => 'integer',
            'fulfilled_orders' => 'integer',
            'late_deliveries' => 'integer',
            'performance_score' => 'decimal:2',
            'last_delivery_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function scopeSearch($query, string $search)
    {
        return $query
            ->where('supplier_code', 'like', "%{$search}%")
            ->orWhere('company_name', 'like', "%{$search}%")
            ->orWhere('contact_person', 'like', "%{$search}%")
            ->orWhere('email_address', 'like', "%{$search}%");
    }
}
