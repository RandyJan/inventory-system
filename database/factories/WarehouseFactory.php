<?php

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'warehouse_code' => 'WH-'.$this->faker->unique()->numerify('####'),
            'name' => $this->faker->company().' Warehouse',
            'type' => $this->faker->randomElement(['warehouse', 'stockroom', 'department']),
            'manager_id' => null,
            'campus' => $this->faker->optional()->city(),
            'building' => $this->faker->optional()->bothify('Building ?'),
            'address' => $this->faker->address(),
            'capacity' => $this->faker->numberBetween(100, 5000),
            'used_capacity' => $this->faker->numberBetween(0, 100),
            'is_active' => true,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
