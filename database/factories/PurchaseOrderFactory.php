<?php

namespace Database\Factories;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'po_number' => 'PO-'.$this->faker->unique()->numerify('######'),
            'supplier_id' => Supplier::factory()->active(),
            'purchase_requisition_id' => null,
            'order_date' => $this->faker->dateTimeBetween('-15 days'),
            'expected_delivery_date' => $this->faker->dateTimeBetween('now', '+45 days'),
            'total_amount' => 0,
            'status' => PurchaseOrder::STATUS_DRAFT,
            'created_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
            'remarks' => $this->faker->optional()->sentence(),
            'approval_remarks' => null,
        ];
    }
}
