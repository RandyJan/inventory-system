<?php

namespace Database\Factories;

use App\Models\InventoryAdjustment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<InventoryAdjustment>
 */
class InventoryAdjustmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'adjustment_number' => 'ADJ-'.$this->faker->unique()->numerify('######'),
            'adjustment_type' => $this->faker->randomElement(InventoryAdjustment::TYPES),
            'reason' => $this->faker->randomElement(InventoryAdjustment::REASONS),
            'adjustment_date' => $this->faker->dateTimeBetween('-30 days')->format('Y-m-d'),
            'adjusted_by' => User::factory(),
            'total_quantity_adjusted' => $this->faker->numberBetween(1, 25),
            'remarks' => Str::limit($this->faker->sentence(), 200),
        ];
    }
}
