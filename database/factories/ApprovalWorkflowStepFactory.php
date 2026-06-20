<?php

namespace Database\Factories;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApprovalWorkflowStep>
 */
class ApprovalWorkflowStepFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'approval_workflow_id' => ApprovalWorkflow::factory(),
            'level' => $this->faker->numberBetween(1, 5),
            'name' => $this->faker->jobTitle(),
            'role_name' => $this->faker->optional()->jobTitle(),
            'permission_name' => $this->faker->unique()->slug(2).'.approve',
            'is_required' => true,
        ];
    }
}
