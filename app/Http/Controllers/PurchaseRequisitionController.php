<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApprovePurchaseRequisitionRequest;
use App\Http\Requests\ConvertPurchaseRequisitionRequest;
use App\Http\Requests\RejectPurchaseRequisitionRequest;
use App\Http\Requests\StorePurchaseRequisitionRequest;
use App\Http\Requests\SubmitPurchaseRequisitionRequest;
use App\Models\PurchaseRequisition;
use App\Services\PurchaseRequisitionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequisitionController extends Controller
{
    public function __construct(private readonly PurchaseRequisitionService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('purchase-requisitions/index', [
            'requisitions' => $this->service->requisitions($request->only(['search', 'status']))
                ->through(fn (PurchaseRequisition $requisition): array => $this->requisitionPayload($requisition)),
            'summary' => $this->service->summary(),
            'items' => $this->service->items(),
            'statuses' => PurchaseRequisition::STATUSES,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(StorePurchaseRequisitionRequest $request): RedirectResponse
    {
        $this->service->create($request->validated(), $request->user());

        return back()->with('success', 'Purchase requisition saved.');
    }

    public function submit(SubmitPurchaseRequisitionRequest $request, PurchaseRequisition $purchaseRequisition): RedirectResponse
    {
        $this->service->submit($purchaseRequisition);

        return back()->with('success', 'Purchase requisition submitted for supervisor approval.');
    }

    public function approve(ApprovePurchaseRequisitionRequest $request, PurchaseRequisition $purchaseRequisition): RedirectResponse
    {
        $this->service->approve($purchaseRequisition, $request->validated(), $request->user());

        return back()->with('success', 'Purchase requisition approved and sent to Purchasing.');
    }

    public function reject(RejectPurchaseRequisitionRequest $request, PurchaseRequisition $purchaseRequisition): RedirectResponse
    {
        $this->service->reject($purchaseRequisition, $request->validated(), $request->user());

        return back()->with('success', 'Purchase requisition rejected.');
    }

    public function convert(ConvertPurchaseRequisitionRequest $request, PurchaseRequisition $purchaseRequisition): RedirectResponse
    {
        $this->service->convert($purchaseRequisition, $request->validated(), $request->user());

        return back()->with('success', 'Purchase requisition converted to purchase order status.');
    }

    /**
     * @return array<string, mixed>
     */
    private function requisitionPayload(PurchaseRequisition $requisition): array
    {
        return [
            'id' => $requisition->id,
            'requisition_number' => $requisition->requisition_number,
            'requesting_department' => $requisition->requesting_department,
            'purpose' => $requisition->purpose,
            'needed_date' => $requisition->needed_date?->format('Y-m-d'),
            'requested_by' => $requisition->requester?->name,
            'supervisor' => $requisition->supervisor?->name,
            'purchasing_officer' => $requisition->purchasingOfficer?->name,
            'purchase_order_reference' => $requisition->purchase_order_reference,
            'status' => $requisition->status,
            'estimated_total' => (float) $requisition->estimated_total,
            'remarks' => $requisition->remarks,
            'approval_remarks' => $requisition->approval_remarks,
            'submitted_at' => $requisition->submitted_at?->format('Y-m-d H:i'),
            'approved_at' => $requisition->approved_at?->format('Y-m-d H:i'),
            'converted_at' => $requisition->converted_at?->format('Y-m-d H:i'),
            'lines' => $requisition->lines->map(fn ($line): array => [
                'id' => $line->id,
                'item' => $line->item ? "{$line->item->item_code} - {$line->item->name}" : null,
                'item_description' => $line->item_description,
                'quantity_requested' => (float) $line->quantity_requested,
                'unit_of_measure' => $line->unit_of_measure,
                'estimated_unit_cost' => (float) $line->estimated_unit_cost,
                'line_total' => (float) $line->quantity_requested * (float) $line->estimated_unit_cost,
                'remarks' => $line->remarks,
            ])->values(),
        ];
    }
}
