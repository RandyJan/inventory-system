<?php

namespace Database\Factories;

use App\Models\PurchaseRequisition;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseRequisition>
 */
class PurchaseRequisitionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'requisition_number' => 'PR-'.$this->faker->unique()->numerify('######'),
            'requesting_department' => $this->faker->randomElement([
                'Administration',
                'Finance',
                'Operations',
                'Procurement',
                'Human Resources',
                'Field Office',
            ]),
            'purpose' => $this->faker->sentence(4),
            'needed_date' => $this->faker->optional()->dateTimeBetween('now', '+45 days'),
            'requested_by' => User::factory(),
            'supervisor_id' => null,
            'purchasing_id' => null,
            'purchase_order_reference' => null,
            'status' => PurchaseRequisition::STATUS_DRAFT,
            'estimated_total' => 0,
            'remarks' => $this->faker->optional()->sentence(),
            'approval_remarks' => null,
            'submitted_at' => null,
            'approved_at' => null,
            'converted_at' => null,
        ];
    }
}
