<?php

namespace Database\Factories;

use App\Models\StockCount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StockCount>
 */
class StockCountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'count_number' => 'CNT-'.$this->faker->unique()->numerify('######'),
            'count_type' => $this->faker->randomElement(StockCount::TYPES),
            'count_date' => $this->faker->dateTimeBetween('-30 days')->format('Y-m-d'),
            'counted_by' => User::factory(),
            'total_items_counted' => 1,
            'variance_items_count' => 1,
            'total_absolute_variance' => $this->faker->numberBetween(1, 10),
            'remarks' => Str::limit($this->faker->sentence(), 200),
        ];
    }
}
