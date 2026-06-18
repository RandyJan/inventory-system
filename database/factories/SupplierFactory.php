<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalOrders = $this->faker->numberBetween(0, 80);
        $fulfilledOrders = $totalOrders === 0 ? 0 : $this->faker->numberBetween(0, $totalOrders);
        $lateDeliveries = $fulfilledOrders === 0 ? 0 : $this->faker->numberBetween(0, $fulfilledOrders);

        return [
            'supplier_code' => 'SUP-'.$this->faker->unique()->numerify('######'),
            'company_name' => $this->faker->company(),
            'contact_person' => $this->faker->name(),
            'email_address' => $this->faker->unique()->safeEmail(),
            'phone_number' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'tax_identification_number' => $this->faker->unique()->numerify('###-###-###-###'),
            'status' => $this->faker->randomElement(['active', 'inactive', 'on_hold']),
            'total_orders' => $totalOrders,
            'fulfilled_orders' => $fulfilledOrders,
            'late_deliveries' => $lateDeliveries,
            'performance_score' => $this->faker->randomFloat(2, 60, 100),
            'last_delivery_at' => $this->faker->optional()->dateTimeBetween('-1 year'),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => 'active',
        ]);
    }
}
