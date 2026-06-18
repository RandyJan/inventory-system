<?php

namespace Database\Factories;

use App\Models\StockReceiving;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockReceiving>
 */
class StockReceivingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'receiving_number' => 'RCV-'.$this->faker->unique()->numerify('######'),
            'supplier_id' => Supplier::factory(),
            'delivery_date' => $this->faker->dateTimeBetween('-30 days'),
            'purchase_order_reference' => 'PO-'.$this->faker->numerify('######'),
            'received_by' => User::factory(),
            'total_quantity_received' => 0,
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
