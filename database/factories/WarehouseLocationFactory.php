<?php

namespace Database\Factories;

use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WarehouseLocation>
 */
class WarehouseLocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'warehouse_id' => Warehouse::factory(),
            'parent_id' => null,
            'location_code' => 'LOC-'.$this->faker->unique()->numerify('####'),
            'name' => $this->faker->randomElement(['Receiving', 'Main Rack', 'Cold Room', 'Shelf A', 'Bin 01']),
            'type' => $this->faker->randomElement(['stockroom', 'aisle', 'rack', 'shelf', 'bin']),
            'building' => $this->faker->randomElement(['Main Building', 'Annex', 'North Wing']),
            'floor' => $this->faker->randomElement(['Ground', '2', '3']),
            'room' => $this->faker->optional()->bothify('Room ##'),
            'rack' => $this->faker->optional()->bothify('Rack ?'),
            'shelf' => $this->faker->optional()->bothify('Shelf #'),
            'bin' => $this->faker->optional()->bothify('Bin ##'),
            'capacity' => $this->faker->numberBetween(10, 500),
            'used_capacity' => $this->faker->numberBetween(0, 10),
            'is_active' => true,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
