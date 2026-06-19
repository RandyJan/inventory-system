<?php

namespace App\Services;

use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentLine;
use App\Models\Item;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InventoryAdjustmentService
{
    /**
     * @param  array{search?: string|null, adjustment_type?: string|null, reason?: string|null}  $filters
     * @return LengthAwarePaginator<int, InventoryAdjustment>
     */
    public function adjustments(array $filters): LengthAwarePaginator
    {
        return InventoryAdjustment::query()
            ->with(['adjuster:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('adjustment_number', 'like', "%{$search}%")
                        ->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhereHas('lines.item', fn (Builder $query) => $query
                            ->where('item_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['adjustment_type'] ?? null, fn (Builder $query, mixed $type) => $query->where('adjustment_type', $type))
            ->when($filters['reason'] ?? null, fn (Builder $query, mixed $reason) => $query->where('reason', $reason))
            ->latest('adjustment_date')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, increases: int, decreases: int, damaged: int, lost: int, quantity_adjusted: float}
     */
    public function summary(): array
    {
        return [
            'total' => InventoryAdjustment::query()->count(),
            'increases' => InventoryAdjustment::query()->where('adjustment_type', InventoryAdjustment::TYPE_INCREASE)->count(),
            'decreases' => InventoryAdjustment::query()->where('adjustment_type', InventoryAdjustment::TYPE_DECREASE)->count(),
            'damaged' => InventoryAdjustment::query()->where('adjustment_type', InventoryAdjustment::TYPE_DAMAGED)->count(),
            'lost' => InventoryAdjustment::query()->where('adjustment_type', InventoryAdjustment::TYPE_LOST)->count(),
            'quantity_adjusted' => (float) InventoryAdjustmentLine::query()->sum('quantity_adjusted'),
        ];
    }

    /**
     * @return Collection<int, array{id: int, label: string, unit_of_measure: string, quantity_on_hand: float}>
     */
    public function items(): Collection
    {
        return Item::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'item_code', 'name', 'unit_of_measure', 'quantity_on_hand'])
            ->map(fn (Item $item): array => [
                'id' => $item->id,
                'label' => "{$item->item_code} - {$item->name}",
                'unit_of_measure' => $item->unit_of_measure,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(array $data, User $adjuster): InventoryAdjustment
    {
        return DB::transaction(function () use ($data, $adjuster): InventoryAdjustment {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => (int) $line['item_id'],
                    'quantity_adjusted' => (float) $line['quantity_adjusted'],
                    'remarks' => $line['remarks'] ?? null,
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $isIncrease = $data['adjustment_type'] === InventoryAdjustment::TYPE_INCREASE;

            $lines->each(function (array $line) use ($items, $isIncrease): void {
                /** @var Item|null $item */
                $item = $items->get($line['item_id']);

                if ($item === null) {
                    throw ValidationException::withMessages([
                        'lines' => 'One or more selected items could not be found.',
                    ]);
                }

                if (! $isIncrease && (float) $item->quantity_on_hand < $line['quantity_adjusted']) {
                    throw ValidationException::withMessages([
                        'lines' => 'One or more items do not have enough stock for this adjustment.',
                    ]);
                }
            });

            $adjustment = InventoryAdjustment::create([
                'adjustment_number' => ($data['adjustment_number'] ?? null) ?: $this->nextAdjustmentNumber(),
                'adjustment_type' => $data['adjustment_type'],
                'reason' => $data['reason'],
                'adjustment_date' => $data['adjustment_date'],
                'adjusted_by' => $adjuster->id,
                'total_quantity_adjusted' => $lines->sum('quantity_adjusted'),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $lines->each(function (array $line) use ($adjustment, $items, $isIncrease): void {
                /** @var Item $item */
                $item = $items->get($line['item_id']);
                $quantityBefore = (float) $item->quantity_on_hand;
                $quantityAfter = $isIncrease
                    ? $quantityBefore + $line['quantity_adjusted']
                    : $quantityBefore - $line['quantity_adjusted'];

                $adjustment->lines()->create([
                    'item_id' => $item->id,
                    'quantity_adjusted' => $line['quantity_adjusted'],
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $quantityAfter,
                    'unit_of_measure' => $item->unit_of_measure,
                    'remarks' => $line['remarks'],
                ]);

                $item->forceFill([
                    'quantity_on_hand' => $quantityAfter,
                ])->save();
            });

            return $adjustment->load(['adjuster', 'lines.item']);
        });
    }

    private function nextAdjustmentNumber(): string
    {
        return 'ADJ-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
