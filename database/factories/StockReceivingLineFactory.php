<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\StockReceiving;
use App\Models\StockReceivingLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockReceivingLine>
 */
class StockReceivingLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $item = Item::factory()->make();

        return [
            'stock_receiving_id' => StockReceiving::factory(),
            'item_id' => Item::factory(),
            'quantity_received' => $this->faker->numberBetween(1, 50),
            'unit_of_measure' => $item->unit_of_measure,
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
