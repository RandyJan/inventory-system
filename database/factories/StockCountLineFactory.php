<?php

namespace Database\Factories;

use App\Models\StockCountLine;
use App\Models\Item;
use App\Models\StockCount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockCountLine>
 */
class StockCountLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $systemQuantity = $this->faker->numberBetween(1, 50);
        $actualQuantity = $systemQuantity + $this->faker->numberBetween(-5, 5);
        $varianceQuantity = $actualQuantity - $systemQuantity;

        return [
            'stock_count_id' => StockCount::factory(),
            'item_id' => Item::factory(),
            'system_quantity' => $systemQuantity,
            'actual_quantity' => $actualQuantity,
            'variance_quantity' => $varianceQuantity,
            'unit_of_measure' => 'PCS',
            'recommendation' => $varianceQuantity > 0
                ? StockCountLine::RECOMMENDATION_INCREASE
                : ($varianceQuantity < 0 ? StockCountLine::RECOMMENDATION_DECREASE : StockCountLine::RECOMMENDATION_NONE),
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
