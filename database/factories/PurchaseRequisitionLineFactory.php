<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\PurchaseRequisition;
use App\Models\PurchaseRequisitionLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseRequisitionLine>
 */
class PurchaseRequisitionLineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(1, 25);
        $unitCost = $this->faker->randomFloat(2, 50, 2500);

        return [
            'purchase_requisition_id' => PurchaseRequisition::factory(),
            'item_id' => null,
            'item_description' => $this->faker->randomElement([
                'Office paper supplies',
                'Printer toner cartridge',
                'Laptop accessories',
                'Cleaning materials',
                'Filing cabinet',
            ]),
            'quantity_requested' => $quantity,
            'unit_of_measure' => $this->faker->randomElement(['PCS', 'BOX', 'PACK', 'CASE', 'SET']),
            'estimated_unit_cost' => $unitCost,
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
