<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\StockTransfer;
use App\Models\StockTransferLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockTransferLine>
 */
class StockTransferLineFactory extends Factory
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
            'stock_transfer_id' => StockTransfer::factory(),
            'item_id' => Item::factory(),
            'quantity_transferred' => $this->faker->numberBetween(1, 20),
            'unit_of_measure' => $item->unit_of_measure,
        ];
    }
}
