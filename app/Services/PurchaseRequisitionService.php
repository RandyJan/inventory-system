<?php

namespace App\Services;

use App\Models\Item;
use App\Models\PurchaseRequisition;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseRequisitionService
{
    /**
     * @param  array{search?: string|null, status?: string|null}  $filters
     * @return LengthAwarePaginator<int, PurchaseRequisition>
     */
    public function requisitions(array $filters): LengthAwarePaginator
    {
        return PurchaseRequisition::query()
            ->with(['requester:id,name', 'supervisor:id,name', 'purchasingOfficer:id,name', 'lines.item:id,item_code,name,unit_of_measure'])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('requisition_number', 'like', "%{$search}%")
                        ->orWhere('requesting_department', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhere('purchase_order_reference', 'like', "%{$search}%")
                        ->orWhereHas('lines', fn (Builder $query) => $query
                            ->where('item_description', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn (Builder $query, mixed $status) => $query->where('status', $status))
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    /**
     * @return array{total: int, draft: int, submitted: int, approved: int, rejected: int, converted_to_purchase_order: int}
     */
    public function summary(): array
    {
        return [
            'total' => PurchaseRequisition::query()->count(),
            'draft' => PurchaseRequisition::query()->where('status', PurchaseRequisition::STATUS_DRAFT)->count(),
            'submitted' => PurchaseRequisition::query()->where('status', PurchaseRequisition::STATUS_SUBMITTED)->count(),
            'approved' => PurchaseRequisition::query()->where('status', PurchaseRequisition::STATUS_APPROVED)->count(),
            'rejected' => PurchaseRequisition::query()->where('status', PurchaseRequisition::STATUS_REJECTED)->count(),
            'converted_to_purchase_order' => PurchaseRequisition::query()->where('status', PurchaseRequisition::STATUS_CONVERTED)->count(),
        ];
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
    public function create(array $data, User $requester): PurchaseRequisition
    {
        return DB::transaction(function () use ($data, $requester): PurchaseRequisition {
            $lines = collect($data['lines'])
                ->map(fn (array $line): array => [
                    'item_id' => isset($line['item_id']) ? (int) $line['item_id'] : null,
                    'item_description' => $line['item_description'],
                    'quantity_requested' => (float) $line['quantity_requested'],
                    'unit_of_measure' => $line['unit_of_measure'],
                    'estimated_unit_cost' => (float) $line['estimated_unit_cost'],
                    'remarks' => $line['remarks'] ?? null,
                ])
                ->values();

            $isSubmitted = (bool) $data['submit'];

            $requisition = PurchaseRequisition::create([
                'requisition_number' => ($data['requisition_number'] ?? null) ?: $this->nextRequisitionNumber(),
                'requesting_department' => $data['requesting_department'],
                'purpose' => $data['purpose'],
                'needed_date' => $data['needed_date'] ?? null,
                'requested_by' => $requester->id,
                'status' => $isSubmitted ? PurchaseRequisition::STATUS_SUBMITTED : PurchaseRequisition::STATUS_DRAFT,
                'estimated_total' => $this->estimatedTotal($lines),
                'remarks' => $data['remarks'] ?? null,
                'submitted_at' => $isSubmitted ? now() : null,
            ]);

            $lines->each(fn (array $line) => $requisition->lines()->create($line));

            return $requisition->load(['requester', 'supervisor', 'purchasingOfficer', 'lines.item']);
        });
    }

    public function submit(PurchaseRequisition $requisition): PurchaseRequisition
    {
        $this->ensureStatus($requisition, [PurchaseRequisition::STATUS_DRAFT], 'Only draft requisitions can be submitted.');

        $requisition->forceFill([
            'status' => PurchaseRequisition::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ])->save();

        return $requisition->load(['requester', 'supervisor', 'purchasingOfficer', 'lines.item']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function approve(PurchaseRequisition $requisition, array $data, User $supervisor): PurchaseRequisition
    {
        $this->ensureStatus($requisition, [PurchaseRequisition::STATUS_SUBMITTED], 'Only submitted requisitions can be approved.');

        $requisition->forceFill([
            'status' => PurchaseRequisition::STATUS_APPROVED,
            'supervisor_id' => $supervisor->id,
            'approved_at' => now(),
            'approval_remarks' => $data['approval_remarks'] ?? null,
        ])->save();

        return $requisition->load(['requester', 'supervisor', 'purchasingOfficer', 'lines.item']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function reject(PurchaseRequisition $requisition, array $data, User $supervisor): PurchaseRequisition
    {
        $this->ensureStatus($requisition, [PurchaseRequisition::STATUS_SUBMITTED], 'Only submitted requisitions can be rejected.');

        $requisition->forceFill([
            'status' => PurchaseRequisition::STATUS_REJECTED,
            'supervisor_id' => $supervisor->id,
            'approved_at' => now(),
            'approval_remarks' => $data['approval_remarks'],
        ])->save();

        return $requisition->load(['requester', 'supervisor', 'purchasingOfficer', 'lines.item']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function convert(PurchaseRequisition $requisition, array $data, User $purchasingOfficer): PurchaseRequisition
    {
        $this->ensureStatus($requisition, [PurchaseRequisition::STATUS_APPROVED], 'Only approved requisitions can be converted to purchase orders.');

        $requisition->forceFill([
            'status' => PurchaseRequisition::STATUS_CONVERTED,
            'purchasing_id' => $purchasingOfficer->id,
            'purchase_order_reference' => $data['purchase_order_reference'] ?? null,
            'converted_at' => now(),
            'approval_remarks' => $data['approval_remarks'] ?? $requisition->approval_remarks,
        ])->save();

        return $requisition->load(['requester', 'supervisor', 'purchasingOfficer', 'lines.item']);
    }

    /**
     * @param  Collection<int, array{quantity_requested: float, estimated_unit_cost: float}>  $lines
     */
    private function estimatedTotal(Collection $lines): float
    {
        return (float) $lines->sum(fn (array $line): float => $line['quantity_requested'] * $line['estimated_unit_cost']);
    }

    /**
     * @param  list<string>  $allowedStatuses
     */
    private function ensureStatus(PurchaseRequisition $requisition, array $allowedStatuses, string $message): void
    {
        if (! in_array($requisition->status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => $message,
            ]);
        }
    }

    private function nextRequisitionNumber(): string
    {
        return 'PR-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
    }
}
