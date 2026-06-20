<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockCount;
use App\Models\StockCountLine;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockCountService
{
    public function __construct(public InventoryAuditService $auditService) {}

    /**
     * @param  array{search?: string|null, count_type?: string|null, variance?: string|null}  $filters
     * @return LengthAwarePaginator<int, StockCount>
     */
    public function counts(array $filters): LengthAwarePaginator
    {
        return StockCount::query()
            ->with(['counter:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('count_number', 'like', "%{$search}%")
                        ->orWhere('remarks', 'like', "%{$search}%")
                        ->orWhereHas('lines.item', fn (Builder $query) => $query
                            ->where('item_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['count_type'] ?? null, fn (Builder $query, mixed $type) => $query->where('count_type', $type))
            ->when(($filters['variance'] ?? null) === 'with_variance', fn (Builder $query) => $query->where('variance_items_count', '>', 0))
            ->when(($filters['variance'] ?? null) === 'no_variance', fn (Builder $query) => $query->where('variance_items_count', 0))
            ->latest('count_date')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, cycle: int, annual: int, with_variance: int, variance_lines: int, total_absolute_variance: float}
     */
    public function summary(): array
    {
        return [
            'total' => StockCount::query()->count(),
            'cycle' => StockCount::query()->where('count_type', StockCount::TYPE_CYCLE)->count(),
            'annual' => StockCount::query()->where('count_type', StockCount::TYPE_ANNUAL)->count(),
            'with_variance' => StockCount::query()->where('variance_items_count', '>', 0)->count(),
            'variance_lines' => StockCountLine::query()->where('variance_quantity', '!=', 0)->count(),
            'total_absolute_variance' => (float) StockCount::query()->sum('total_absolute_variance'),
        ];
    }

    /**
     * @return Collection<int, array{id: int, item_code: string, barcode: string|null, label: string, unit_of_measure: string, quantity_on_hand: float}>
     */
    public function items(): Collection
    {
        return Item::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'item_code', 'barcode', 'name', 'unit_of_measure', 'quantity_on_hand'])
            ->map(fn (Item $item): array => [
                'id' => $item->id,
                'item_code' => $item->item_code,
                'barcode' => $item->barcode,
                'label' => "{$item->item_code} - {$item->name}",
                'unit_of_measure' => $item->unit_of_measure,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(array $data, User $counter): StockCount
    {
        return DB::transaction(function () use ($data, $counter): StockCount {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => (int) $line['item_id'],
                    'actual_quantity' => (float) $line['actual_quantity'],
                    'remarks' => $line['remarks'] ?? null,
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $preparedLines = $lines->map(function (array $line) use ($items): array {
                /** @var Item $item */
                $item = $items->get($line['item_id']);
                $systemQuantity = (float) $item->quantity_on_hand;
                $actualQuantity = $line['actual_quantity'];
                $varianceQuantity = $actualQuantity - $systemQuantity;

                return [
                    'item' => $item,
                    'actual_quantity' => $actualQuantity,
                    'system_quantity' => $systemQuantity,
                    'variance_quantity' => $varianceQuantity,
                    'recommendation' => $this->recommendation($varianceQuantity),
                    'remarks' => $line['remarks'],
                ];
            });

            $stockCount = StockCount::create([
                'count_number' => ($data['count_number'] ?? null) ?: $this->nextCountNumber(),
                'count_type' => $data['count_type'],
                'count_date' => $data['count_date'],
                'counted_by' => $counter->id,
                'total_items_counted' => $preparedLines->count(),
                'variance_items_count' => $preparedLines->filter(fn (array $line): bool => (float) $line['variance_quantity'] !== 0.0)->count(),
                'total_absolute_variance' => $preparedLines->sum(fn (array $line): float => abs((float) $line['variance_quantity'])),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $oldValues = [];
            $newValues = [];

            $preparedLines->each(function (array $line) use ($stockCount, &$oldValues, &$newValues): void {
                /** @var Item $item */
                $item = $line['item'];

                $stockCount->lines()->create([
                    'item_id' => $item->id,
                    'system_quantity' => $line['system_quantity'],
                    'actual_quantity' => $line['actual_quantity'],
                    'variance_quantity' => $line['variance_quantity'],
                    'unit_of_measure' => $item->unit_of_measure,
                    'recommendation' => $line['recommendation'],
                    'remarks' => $line['remarks'],
                ]);

                $oldValues["items.{$item->id}.quantity_on_hand"] = $line['system_quantity'];
                $newValues["items.{$item->id}.quantity_on_hand"] = $line['actual_quantity'];
                $newValues["items.{$item->id}.item"] = "{$item->item_code} - {$item->name}";
                $newValues["items.{$item->id}.variance_quantity"] = $line['variance_quantity'];
                $newValues["items.{$item->id}.recommendation"] = $line['recommendation'];
                $newValues["items.{$item->id}.unit_of_measure"] = $item->unit_of_measure;
            });

            $this->auditService->record(
                $stockCount,
                $counter,
                'stock-counted',
                'Recorded stock count',
                $oldValues,
                $newValues,
                [
                    'count_number' => $stockCount->count_number,
                    'count_type' => $stockCount->count_type,
                    'variance_items_count' => $stockCount->variance_items_count,
                    'total_absolute_variance' => (float) $stockCount->total_absolute_variance,
                ]
            );

            return $stockCount->load(['counter', 'lines.item']);
        });
    }

    private function recommendation(float $varianceQuantity): string
    {
        if ($varianceQuantity > 0) {
            return StockCountLine::RECOMMENDATION_INCREASE;
        }

        if ($varianceQuantity < 0) {
            return StockCountLine::RECOMMENDATION_DECREASE;
        }

        return StockCountLine::RECOMMENDATION_NONE;
    }

    private function nextCountNumber(): string
    {
        return 'CNT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
