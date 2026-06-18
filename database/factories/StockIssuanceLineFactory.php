<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\StockIssuance;
use App\Models\StockIssuanceLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockIssuanceLine>
 */
class StockIssuanceLineFactory extends Factory
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
            'stock_issuance_id' => StockIssuance::factory(),
            'item_id' => Item::factory(),
            'quantity_issued' => $this->faker->numberBetween(1, 20),
            'unit_of_measure' => $item->unit_of_measure,
        ];
    }
}
