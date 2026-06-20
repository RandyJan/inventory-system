<?php

namespace Database\Factories;

use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use App\Models\StockTransfer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApprovalStep>
 */
class ApprovalStepFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'approvable_type' => StockTransfer::class,
            'approvable_id' => StockTransfer::factory(),
            'approval_workflow_id' => ApprovalWorkflow::factory(),
            'approval_workflow_step_id' => ApprovalWorkflowStep::factory(),
            'level' => $this->faker->numberBetween(1, 5),
            'name' => $this->faker->jobTitle(),
            'role_name' => $this->faker->optional()->jobTitle(),
            'permission_name' => $this->faker->unique()->slug(2).'.approve',
            'status' => ApprovalStep::STATUS_PENDING,
            'acted_by' => null,
            'acted_at' => null,
            'remarks' => null,
        ];
    }
}
