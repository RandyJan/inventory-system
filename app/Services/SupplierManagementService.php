<?php

namespace App\Services;

use App\Models\Supplier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class SupplierManagementService
{
    /**
     * @param  array{search?: string|null, status?: string|null, per_page?: int|string|null}  $filters
     * @return LengthAwarePaginator<int, Supplier>
     */
    public function suppliers(array $filters): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $status = (string) ($filters['status'] ?? '');
        $perPage = (int) ($filters['per_page'] ?? 15);

        return Supplier::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($searchQuery) => $searchQuery->search($search)))
            ->when($status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->orderBy('company_name')
            ->paginate($perPage > 0 ? $perPage : 15)
            ->withQueryString();
    }

    /**
     * @return array{total: int, active: int, on_hold: int, average_performance: float, late_delivery_rate: float}
     */
    public function summary(): array
    {
        $totalSuppliers = Supplier::query()->count();
        $activeSuppliers = Supplier::query()->where('status', Supplier::STATUS_ACTIVE)->count();
        $onHoldSuppliers = Supplier::query()->where('status', Supplier::STATUS_ON_HOLD)->count();
        $fulfilledOrders = (int) Supplier::query()->sum('fulfilled_orders');
        $lateDeliveries = (int) Supplier::query()->sum('late_deliveries');

        return [
            'total' => $totalSuppliers,
            'active' => $activeSuppliers,
            'on_hold' => $onHoldSuppliers,
            'average_performance' => round((float) Supplier::query()->avg('performance_score'), 2),
            'late_delivery_rate' => $fulfilledOrders > 0
                ? round(($lateDeliveries / $fulfilledOrders) * 100, 2)
                : 0.0,
        ];
    }

    /**
     * @return Collection<int, array{value: string, label: string}>
     */
    public function statuses(): Collection
    {
        return collect(Supplier::STATUSES)
            ->map(fn (string $status): array => [
                'value' => $status,
                'label' => str($status)->replace('_', ' ')->title()->toString(),
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Supplier
    {
        return Supplier::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Supplier $supplier, array $data): Supplier
    {
        $supplier->update($data);

        return $supplier;
    }
}
