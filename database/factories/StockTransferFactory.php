<?php

namespace Database\Factories;

use App\Models\StockTransfer;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockTransfer>
 */
class StockTransferFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transfer_number' => 'TRF-'.$this->faker->unique()->numerify('######'),
            'source_warehouse_id' => Warehouse::factory(),
            'destination_warehouse_id' => Warehouse::factory(),
            'destination_location_id' => null,
            'requested_by' => User::factory(),
            'approved_by' => null,
            'requested_date' => $this->faker->dateTimeBetween('-30 days'),
            'approved_date' => null,
            'status' => StockTransfer::STATUS_PENDING,
            'total_quantity_transferred' => 0,
            'remarks' => $this->faker->optional()->sentence(),
            'approval_remarks' => null,
        ];
    }
}
