<?php

namespace App\Services;

use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequisition;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseOrderService
{
    /**
     * @param  array{search?: string|null, status?: string|null, supplier_id?: int|string|null}  $filters
     * @return LengthAwarePaginator<int, PurchaseOrder>
     */
    public function purchaseOrders(array $filters): LengthAwarePaginator
    {
        return PurchaseOrder::query()
            ->with(['supplier:id,supplier_code,company_name', 'purchaseRequisition:id,requisition_number', 'creator:id,name', 'approver:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('po_number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', fn (Builder $query) => $query
                            ->where('supplier_code', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%"))
                        ->orWhereHas('purchaseRequisition', fn (Builder $query) => $query
                            ->where('requisition_number', 'like', "%{$search}%"))
                        ->orWhereHas('lines', fn (Builder $query) => $query
                            ->where('item_description', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, mixed $status) => $query->where('status', $status))
            ->when($filters['supplier_id'] ?? null, fn (Builder $query, mixed $supplierId) => $query->where('supplier_id', $supplierId))
            ->latest('order_date')
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, draft: int, pending_approval: int, approved: int, rejected: int, total_amount: float}
     */
    public function summary(): array
    {
        return [
            'total' => PurchaseOrder::query()->count(),
            'draft' => PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_DRAFT)->count(),
            'pending_approval' => PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_PENDING)->count(),
            'approved' => PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_APPROVED)->count(),
            'rejected' => PurchaseOrder::query()->where('status', PurchaseOrder::STATUS_REJECTED)->count(),
            'total_amount' => (float) PurchaseOrder::query()->sum('total_amount'),
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
     * @return Collection<int, array{id: int, label: string}>
     */
    public function requisitions(): Collection
    {
        return PurchaseRequisition::query()
            ->where('status', PurchaseRequisition::STATUS_APPROVED)
            ->orderByDesc('approved_at')
            ->get(['id', 'requisition_number', 'requesting_department', 'estimated_total'])
            ->map(fn (PurchaseRequisition $requisition): array => [
                'id' => $requisition->id,
                'label' => "{$requisition->requisition_number} - {$requisition->requesting_department} (".number_format((float) $requisition->estimated_total, 2).')',
            ]);
    }

    /**
     * @return Collection<int, array{id: int, label: string, unit_of_measure: string}>
     */
    public function items(): Collection
    {
        return Item::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'item_code', 'name', 'unit_of_measure'])
            ->map(fn (Item $item): array => [
                'id' => $item->id,
                'label' => "{$item->item_code} - {$item->name}",
                'unit_of_measure' => $item->unit_of_measure,
            ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $creator): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $creator): PurchaseOrder {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => isset($line['item_id']) ? (int) $line['item_id'] : null,
                    'item_description' => $line['item_description'],
                    'quantity_ordered' => (float) $line['quantity_ordered'],
                    'unit_of_measure' => $line['unit_of_measure'],
                    'unit_cost' => (float) $line['unit_cost'],
                    'remarks' => $line['remarks'] ?? null,
                ])
                ->values();

            $isSubmitted = (bool) $data['submit'];

            $purchaseOrder = PurchaseOrder::create([
                'po_number' => ($data['po_number'] ?? null) ?: $this->nextPoNumber(),
                'supplier_id' => $data['supplier_id'],
                'purchase_requisition_id' => $data['purchase_requisition_id'] ?? null,
                'order_date' => $data['order_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'total_amount' => $this->totalAmount($lines),
                'status' => $isSubmitted ? PurchaseOrder::STATUS_PENDING : PurchaseOrder::STATUS_DRAFT,
                'created_by' => $creator->id,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $lines->each(fn (array $line) => $purchaseOrder->lines()->create($line));

            return $purchaseOrder->load(['supplier', 'purchaseRequisition', 'creator', 'approver', 'lines.item']);
        });
    }

    public function submit(PurchaseOrder $purchaseOrder): PurchaseOrder
    {
        $this->ensureStatus($purchaseOrder, [PurchaseOrder::STATUS_DRAFT], 'Only draft purchase orders can be submitted for approval.');

        $purchaseOrder->forceFill([
            'status' => PurchaseOrder::STATUS_PENDING,
        ])->save();

        return $purchaseOrder->load(['supplier', 'purchaseRequisition', 'creator', 'approver', 'lines.item']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function approve(PurchaseOrder $purchaseOrder, array $data, User $approver): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $data, $approver): PurchaseOrder {
            $this->ensureStatus($purchaseOrder, [PurchaseOrder::STATUS_PENDING], 'Only pending purchase orders can be approved.');

            $purchaseOrder->forceFill([
                'status' => PurchaseOrder::STATUS_APPROVED,
                'approved_by' => $approver->id,
                'approved_at' => now(),
                'approval_remarks' => $data['approval_remarks'] ?? null,
            ])->save();

            Supplier::query()
                ->whereKey($purchaseOrder->supplier_id)
                ->update([
                    'total_orders' => DB::raw('total_orders + 1'),
                ]);

            if ($purchaseOrder->purchase_requisition_id) {
                PurchaseRequisition::query()
                    ->whereKey($purchaseOrder->purchase_requisition_id)
                    ->update([
                        'status' => PurchaseRequisition::STATUS_CONVERTED,
                        'purchasing_id' => $approver->id,
                        'purchase_order_reference' => $purchaseOrder->po_number,
                        'converted_at' => now(),
                    ]);
            }

            return $purchaseOrder->load(['supplier', 'purchaseRequisition', 'creator', 'approver', 'lines.item']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function reject(PurchaseOrder $purchaseOrder, array $data, User $approver): PurchaseOrder
    {
        $this->ensureStatus($purchaseOrder, [PurchaseOrder::STATUS_PENDING], 'Only pending purchase orders can be rejected.');

        $purchaseOrder->forceFill([
            'status' => PurchaseOrder::STATUS_REJECTED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'approval_remarks' => $data['approval_remarks'],
        ])->save();

        return $purchaseOrder->load(['supplier', 'purchaseRequisition', 'creator', 'approver', 'lines.item']);
    }

    /**
     * @param  Collection<int, array{quantity_ordered: float, unit_cost: float}>  $lines
     */
    private function totalAmount(Collection $lines): float
    {
        return (float) $lines->sum(fn (array $line): float => $line['quantity_ordered'] * $line['unit_cost']);
    }

    /**
     * @param  list<string>  $allowedStatuses
     */
    private function ensureStatus(PurchaseOrder $purchaseOrder, array $allowedStatuses, string $message): void
    {
        if (! in_array($purchaseOrder->status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }

    private function nextPoNumber(): string
    {
        return 'PO-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
