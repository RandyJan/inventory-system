<?php

namespace Database\Factories;

use App\Models\InventoryAdjustmentLine;
use App\Models\InventoryAdjustment;
use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryAdjustmentLine>
 */
class InventoryAdjustmentLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantityAdjusted = $this->faker->numberBetween(1, 10);
        $quantityBefore = $this->faker->numberBetween($quantityAdjusted, 50);

        return [
            'inventory_adjustment_id' => InventoryAdjustment::factory(),
            'item_id' => Item::factory(),
            'quantity_adjusted' => $quantityAdjusted,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityBefore - $quantityAdjusted,
            'unit_of_measure' => 'PCS',
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }
}
