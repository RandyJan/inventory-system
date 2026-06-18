<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrderLine>
 */
class PurchaseOrderLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'item_id' => null,
            'item_description' => $this->faker->randomElement([
                'Office paper supplies',
                'Printer toner cartridge',
                'Laptop accessories',
                'Cleaning materials',
                'Filing cabinet',
            ]),
            'quantity_ordered' => $this->faker->numberBetween(1, 25),
            'unit_of_measure' => $this->faker->randomElement(['PCS', 'BOX', 'PACK', 'CASE', 'SET']),
            'unit_cost' => $this->faker->randomFloat(2, 50, 2500),
            'remarks' => $this->faker->optional()->sentence(),
        ];
    }

    public function forItem(): static
    {
        return $this->state(fn (): array => [
            'item_id' => Item::factory(),
        ]);
    }
}
