<?php

namespace Database\Factories;

use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Item>
 */
class ItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = [
            'Office Supplies',
            'IT Equipment',
            'Furniture',
            'Maintenance Materials',
            'Medical Supplies',
            'Consumables',
        ];

        $subcategories = [
            'Office Supplies' => ['Paper', 'Pens', 'Folders', 'Staplers'],
            'IT Equipment' => ['Laptops', 'Monitors', 'Keyboards', 'Mice'],
            'Furniture' => ['Desks', 'Chairs', 'Cabinets', 'Shelves'],
            'Maintenance Materials' => ['Cleaning Supplies', 'Tools', 'Hardware'],
            'Medical Supplies' => ['First Aid', 'Safety Equipment'],
            'Consumables' => ['Coffee', 'Tea', 'Snacks'],
        ];

        $selectedCategory = $this->faker->randomElement($categories);
        $selectedSubcategory = $this->faker->randomElement($subcategories[$selectedCategory]);

        return [
            'item_code' => 'SKU-'.$this->faker->unique()->numerify('######'),
            'barcode' => $this->faker->unique()->numerify('##############'),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
            'category' => $selectedCategory,
            'subcategory' => $selectedSubcategory,
            'category_id' => null,
            'subcategory_id' => null,
            'quantity_on_hand' => 0,
            'unit_of_measure' => $this->faker->randomElement(['PCS', 'BOX', 'PACK', 'CASE', 'KG', 'L']),
            'brand' => $this->faker->optional()->company(),
            'manufacturer' => $this->faker->optional()->company(),
            'reorder_level' => $this->faker->numberBetween(10, 100),
            'maximum_stock_level' => $this->faker->numberBetween(200, 1000),
            'minimum_stock_level' => $this->faker->numberBetween(5, 50),
            'standard_cost' => $this->faker->optional()->randomFloat(2, 1, 1000),
            'selling_price' => $this->faker->optional()->randomFloat(2, 10, 5000),
            'is_archived' => false,
        ];
    }
}
