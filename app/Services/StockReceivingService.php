<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockReceiving;
use App\Models\StockReceivingLine;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockReceivingService
{
    public function __construct(public InventoryAuditService $auditService) {}

    /**
     * @param  array{search?: string|null, supplier_id?: int|string|null}  $filters
     * @return LengthAwarePaginator<int, StockReceiving>
     */
    public function receivings(array $filters): LengthAwarePaginator
    {
        return StockReceiving::query()
            ->with(['supplier:id,supplier_code,company_name', 'receiver:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('receiving_number', 'like', "%{$search}%")
                        ->orWhere('purchase_order_reference', 'like', "%{$search}%")
                        ->orWhereHas('supplier', fn (Builder $query) => $query
                            ->where('supplier_code', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%"));
                });
            })
            ->when($filters['supplier_id'] ?? null, fn (Builder $query, mixed $supplierId) => $query->where('supplier_id', $supplierId))
            ->latest('delivery_date')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, received_this_month: int, total_quantity: float, suppliers_served: int}
     */
    public function summary(): array
    {
        return [
            'total' => StockReceiving::query()->count(),
            'received_this_month' => StockReceiving::query()
                ->whereBetween('delivery_date', [now()->startOfMonth(), now()->endOfMonth()])
                ->count(),
            'total_quantity' => (float) StockReceivingLine::query()->sum('quantity_received'),
            'suppliers_served' => StockReceiving::query()->distinct('supplier_id')->count('supplier_id'),
        ];
    }

    /**
     * @return Collection<int, array{id: int, label: string}>
     */
    public function suppliers(): Collection
    {
        return Supplier::query()
            ->where('status', Supplier::STATUS_ACTIVE)
            ->orderBy('company_name')
            ->get(['id', 'supplier_code', 'company_name'])
            ->map(fn (Supplier $supplier): array => [
                'id' => $supplier->id,
                'label' => "{$supplier->supplier_code} - {$supplier->company_name}",
            ]);
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
    public function record(array $data, User $receiver): StockReceiving
    {
        return DB::transaction(function () use ($data, $receiver): StockReceiving {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => (int) $line['item_id'],
                    'quantity_received' => (float) $line['quantity_received'],
                    'remarks' => $line['remarks'] ?? null,
                ])
                ->values();

            $items = Item::query()
                ->whereIn('id', $lines->pluck('item_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $receiving = StockReceiving::create([
                'receiving_number' => ($data['receiving_number'] ?? null) ?: $this->nextReceivingNumber(),
                'supplier_id' => $data['supplier_id'],
                'delivery_date' => $data['delivery_date'],
                'purchase_order_reference' => $data['purchase_order_reference'] ?? null,
                'received_by' => $receiver->id,
                'total_quantity_received' => $lines->sum('quantity_received'),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $oldValues = [];
            $newValues = [];

            $lines->each(function (array $line) use ($items, $receiving, &$oldValues, &$newValues): void {
                /** @var Item $item */
                $item = $items->get($line['item_id']);
                $quantityBefore = (float) $item->quantity_on_hand;
                $quantityAfter = $quantityBefore + $line['quantity_received'];

                $receiving->lines()->create([
                    'item_id' => $item->id,
                    'quantity_received' => $line['quantity_received'],
                    'unit_of_measure' => $item->unit_of_measure,
                    'remarks' => $line['remarks'],
                ]);

                $item->forceFill([
                    'quantity_on_hand' => $quantityAfter,
                ])->save();

                $oldValues["items.{$item->id}.quantity_on_hand"] = $quantityBefore;
                $newValues["items.{$item->id}.quantity_on_hand"] = $quantityAfter;
                $newValues["items.{$item->id}.item"] = "{$item->item_code} - {$item->name}";
                $newValues["items.{$item->id}.quantity_received"] = $line['quantity_received'];
                $newValues["items.{$item->id}.unit_of_measure"] = $item->unit_of_measure;
            });

            Supplier::query()
                ->whereKey($data['supplier_id'])
                ->update([
                    'total_orders' => DB::raw('total_orders + 1'),
                    'fulfilled_orders' => DB::raw('fulfilled_orders + 1'),
                    'last_delivery_at' => $data['delivery_date'],
                ]);

            $this->auditService->record(
                $receiving,
                $receiver,
                'stock-received',
                'Recorded stock receiving',
                $oldValues,
                $newValues,
                [
                    'receiving_number' => $receiving->receiving_number,
                    'supplier_id' => $receiving->supplier_id,
                    'total_quantity_received' => (float) $receiving->total_quantity_received,
                ]
            );

            return $receiving->load(['supplier', 'receiver', 'lines.item']);
        });
    }

    private function nextReceivingNumber(): string
    {
        return 'RCV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
