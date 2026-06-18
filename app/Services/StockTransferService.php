<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockTransfer;
use App\Models\StockTransferLine;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StockTransferService
{
    /**
     * @param  array{search?: string|null, status?: string|null}  $filters
     * @return LengthAwarePaginator<int, StockTransfer>
     */
    public function transfers(array $filters): LengthAwarePaginator
    {
        return StockTransfer::query()
            ->with([
                'sourceWarehouse:id,warehouse_code,name',
                'destinationWarehouse:id,warehouse_code,name',
                'destinationLocation:id,location_code,name',
                'requester:id,name',
                'approver:id,name',
                'lines.item:id,item_code,name,unit_of_measure',
            ])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('transfer_number', 'like', "%{$search}%")
                        ->orWhereHas('sourceWarehouse', fn (Builder $query) => $query
                            ->where('warehouse_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"))
                        ->orWhereHas('destinationWarehouse', fn (Builder $query) => $query
                            ->where('warehouse_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"))
                        ->orWhereHas('lines.item', fn (Builder $query) => $query
                            ->where('item_code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, mixed $status) => $query->where('status', $status))
            ->latest('requested_date')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, pending: int, approved: int, rejected: int}
     */
    public function summary(): array
    {
        return [
            'total' => StockTransfer::query()->count(),
            'pending' => StockTransfer::query()->where('status', StockTransfer::STATUS_PENDING)->count(),
            'approved' => StockTransfer::query()->where('status', StockTransfer::STATUS_APPROVED)->count(),
            'rejected' => StockTransfer::query()->where('status', StockTransfer::STATUS_REJECTED)->count(),
        ];
    }

    /**
     * @return Collection<int, array{id: int, label: string}>
     */
    public function warehouses(): Collection
    {
        return Warehouse::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'warehouse_code', 'name'])
            ->map(fn (Warehouse $warehouse): array => [
                'id' => $warehouse->id,
                'label' => "{$warehouse->warehouse_code} - {$warehouse->name}",
            ]);
    }

    /**
     * @return Collection<int, array{id: int, warehouse_id: int, label: string}>
     */
    public function locations(): Collection
    {
        return WarehouseLocation::query()
            ->where('is_active', true)
            ->orderBy('location_code')
            ->get(['id', 'warehouse_id', 'location_code', 'name'])
            ->map(fn (WarehouseLocation $location): array => [
                'id' => $location->id,
                'warehouse_id' => $location->warehouse_id,
                'label' => "{$location->location_code} - {$location->name}",
            ]);
    }

    /**
     * @return Collection<int, array{id: int, warehouse_id: int|null, label: string, unit_of_measure: string, quantity_on_hand: float}>
     */
    public function items(): Collection
    {
        return Item::query()
            ->active()
            ->where('quantity_on_hand', '>', 0)
            ->orderBy('name')
            ->get(['id', 'item_code', 'name', 'warehouse_id', 'unit_of_measure', 'quantity_on_hand'])
            ->map(fn (Item $item): array => [
                'id' => $item->id,
                'warehouse_id' => $item->warehouse_id,
                'label' => "{$item->item_code} - {$item->name}",
                'unit_of_measure' => $item->unit_of_measure,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function request(array $data, User $requester): StockTransfer
    {
        return DB::transaction(function () use ($data, $requester): StockTransfer {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => (int) $line['item_id'],
                    'quantity_transferred' => (float) $line['quantity_transferred'],
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $this->validateTransferLines($lines, $items, (int) $data['source_warehouse_id']);

            $transfer = StockTransfer::create([
                'transfer_number' => ($data['transfer_number'] ?? null) ?: $this->nextTransferNumber(),
                'source_warehouse_id' => $data['source_warehouse_id'],
                'destination_warehouse_id' => $data['destination_warehouse_id'],
                'destination_location_id' => $data['destination_location_id'] ?? null,
                'requested_by' => $requester->id,
                'requested_date' => $data['requested_date'],
                'status' => StockTransfer::STATUS_PENDING,
                'total_quantity_transferred' => $lines->sum('quantity_transferred'),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $lines->each(function (array $line) use ($items, $transfer): void {
                /** @var Item $item */
                $item = $items->get($line['item_id']);

                $transfer->lines()->create([
                    'item_id' => $item->id,
                    'quantity_transferred' => $line['quantity_transferred'],
                    'unit_of_measure' => $item->unit_of_measure,
                ]);
            });

            return $transfer->load(['sourceWarehouse', 'destinationWarehouse', 'destinationLocation', 'requester', 'approver', 'lines.item']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function approve(StockTransfer $transfer, array $data, User $approver): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $data, $approver): StockTransfer {
            /** @var StockTransfer $transfer */
            $transfer = StockTransfer::query()
                ->with('lines')
                ->lockForUpdate()
                ->findOrFail($transfer->id);

            $this->ensurePending($transfer);

            $items = Item::query()
                ->whereIn('id', $transfer->lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $this->validateTransferLines(
                $transfer->lines->map(fn (StockTransferLine $line): array => [
                    'item_id' => $line->item_id,
                    'quantity_transferred' => (float) $line->quantity_transferred,
                ]),
                $items,
                $transfer->source_warehouse_id
            );

            $transfer->lines->each(function (StockTransferLine $line) use ($items, $transfer): void {
                /** @var Item $item */
                $item = $items->get($line->item_id);

                $item->forceFill([
                    'warehouse_id' => $transfer->destination_warehouse_id,
                    'warehouse_location_id' => $transfer->destination_location_id,
                ])->save();
            });

            $transfer->forceFill([
                'status' => StockTransfer::STATUS_APPROVED,
                'approved_by' => $approver->id,
                'approved_date' => now()->toDateString(),
                'approval_remarks' => $data['approval_remarks'] ?? null,
            ])->save();

            return $transfer->load(['sourceWarehouse', 'destinationWarehouse', 'destinationLocation', 'requester', 'approver', 'lines.item']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function reject(StockTransfer $transfer, array $data, User $approver): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $data, $approver): StockTransfer {
            /** @var StockTransfer $transfer */
            $transfer = StockTransfer::query()
                ->lockForUpdate()
                ->findOrFail($transfer->id);

            $this->ensurePending($transfer);

            $transfer->forceFill([
                'status' => StockTransfer::STATUS_REJECTED,
                'approved_by' => $approver->id,
                'approved_date' => now()->toDateString(),
                'approval_remarks' => $data['approval_remarks'],
            ])->save();

            return $transfer->load(['sourceWarehouse', 'destinationWarehouse', 'destinationLocation', 'requester', 'approver', 'lines.item']);
        });
    }

    /**
     * @param  Collection<int, array{item_id: int, quantity_transferred: float}>  $lines
     * @param  Collection<int, Item>  $items
     */
    private function validateTransferLines(Collection $lines, Collection $items, int $sourceWarehouseId): void
    {
        $lines->each(function (array $line) use ($items, $sourceWarehouseId): void {
            /** @var Item|null $item */
            $item = $items->get($line['item_id']);

            if (! $item || (int) $item->warehouse_id !== $sourceWarehouseId) {
                throw ValidationException::withMessages([
                    'lines' => 'Every selected item must currently belong to the source warehouse.',
                ]);
            }

            if ((float) $item->quantity_on_hand < $line['quantity_transferred']) {
                throw ValidationException::withMessages([
                    'lines' => 'One or more items do not have enough stock for this transfer.',
                ]);
            }
        });
    }

    private function ensurePending(StockTransfer $transfer): void
    {
        if ($transfer->status !== StockTransfer::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'transfer' => 'Only pending transfer requests can be approved or rejected.',
            ]);
        }
    }

    private function nextTransferNumber(): string
    {
        return 'TRF-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
