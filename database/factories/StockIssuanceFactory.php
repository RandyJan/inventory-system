<?php

namespace Database\Factories;

use App\Models\StockIssuance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockIssuance>
 */
class StockIssuanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'issue_number' => 'ISS-'.$this->faker->unique()->numerify('######'),
            'requesting_department' => $this->faker->randomElement([
                'Administration',
                'Finance',
                'Operations',
                'Procurement',
                'Human Resources',
                'Field Office',
            ]),
            'requestor' => $this->faker->name(),
            'date_issued' => $this->faker->dateTimeBetween('-30 days'),
            'released_by' => User::factory(),
            'total_quantity_issued' => 0,
        ];
    }
}
