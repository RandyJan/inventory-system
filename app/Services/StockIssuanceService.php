<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockIssuance;
use App\Models\StockIssuanceLine;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StockIssuanceService
{
    /**
     * @param  array{search?: string|null, department?: string|null}  $filters
     * @return LengthAwarePaginator<int, StockIssuance>
     */
    public function issuances(array $filters): LengthAwarePaginator
    {
        return StockIssuance::query()
            ->with(['releaser:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('issue_number', 'like', "%{$search}%")
                        ->orWhere('requesting_department', 'like', "%{$search}%")
                        ->orWhere('requestor', 'like', "%{$search}%")
                        ->orWhereHas('lines.item', fn (Builder $query) => $query
                            ->where('item_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['department'] ?? null, fn (Builder $query, mixed $department) => $query->where('requesting_department', $department))
            ->latest('date_issued')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, issued_this_month: int, total_quantity: float, departments_served: int}
     */
    public function summary(): array
    {
        return [
            'total' => StockIssuance::query()->count(),
            'issued_this_month' => StockIssuance::query()
                ->whereBetween('date_issued', [now()->startOfMonth(), now()->endOfMonth()])
                ->count(),
            'total_quantity' => (float) StockIssuanceLine::query()->sum('quantity_issued'),
            'departments_served' => StockIssuance::query()->distinct('requesting_department')->count('requesting_department'),
        ];
    }

    /**
     * @return Collection<int, string>
     */
    public function departments(): Collection
    {
        return StockIssuance::query()
            ->select('requesting_department')
            ->distinct()
            ->orderBy('requesting_department')
            ->pluck('requesting_department');
    }

    /**
     * @return Collection<int, array{id: int, label: string, unit_of_measure: string, quantity_on_hand: float}>
     */
    public function items(): Collection
    {
        return Item::query()
            ->active()
            ->where('quantity_on_hand', '>', 0)
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
    public function record(array $data, User $releaser): StockIssuance
    {
        return DB::transaction(function () use ($data, $releaser): StockIssuance {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => (int) $line['item_id'],
                    'quantity_issued' => (float) $line['quantity_issued'],
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $lines->each(function (array $line) use ($items): void {
                /** @var Item|null $item */
                $item = $items->get($line['item_id']);

                if (! $item || (float) $item->quantity_on_hand < $line['quantity_issued']) {
                    throw ValidationException::withMessages([
                        'lines' => 'One or more items do not have enough stock for this issuance.',
                    ]);
                }
            });

            $issuance = StockIssuance::create([
                'issue_number' => ($data['issue_number'] ?? null) ?: $this->nextIssueNumber(),
                'requesting_department' => $data['requesting_department'],
                'requestor' => $data['requestor'],
                'date_issued' => $data['date_issued'],
                'released_by' => $releaser->id,
                'total_quantity_issued' => $lines->sum('quantity_issued'),
            ]);

            $lines->each(function (array $line) use ($items, $issuance): void {
                /** @var Item $item */
                $item = $items->get($line['item_id']);

                $issuance->lines()->create([
                    'item_id' => $item->id,
                    'quantity_issued' => $line['quantity_issued'],
                    'unit_of_measure' => $item->unit_of_measure,
                ]);

                $item->decrement('quantity_on_hand', $line['quantity_issued']);
            });

            return $issuance->load(['releaser', 'lines.item']);
        });
    }

    private function nextIssueNumber(): string
    {
        return 'ISS-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
