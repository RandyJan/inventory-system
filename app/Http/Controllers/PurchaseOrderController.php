<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApprovePurchaseOrderRequest;
use App\Http\Requests\RejectPurchaseOrderRequest;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Http\Requests\SubmitPurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function __construct(private readonly PurchaseOrderService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $this->service->purchaseOrders($request->only(['search', 'status', 'supplier_id']))
                ->through(fn (PurchaseOrder $purchaseOrder): array => $this->purchaseOrderPayload($purchaseOrder)),
            'summary' => $this->service->summary(),
            'suppliers' => $this->service->suppliers(),
            'requisitions' => $this->service->requisitions(),
            'items' => $this->service->items(),
            'statuses' => PurchaseOrder::STATUSES,
            'filters' => $request->only(['search', 'status', 'supplier_id']),
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $this->service->create($request->validated(), $request->user());

        return back()->with('success', 'Purchase order saved.');
    }

    public function submit(SubmitPurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->service->submit($purchaseOrder);

        return back()->with('success', 'Purchase order submitted for approval.');
    }

    public function approve(ApprovePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->service->approve($purchaseOrder, $request->validated(), $request->user());

        return back()->with('success', 'Purchase order approved.');
    }

    public function reject(RejectPurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->service->reject($purchaseOrder, $request->validated(), $request->user());

        return back()->with('success', 'Purchase order rejected.');
    }

    /**
     * @return array<string, mixed>
     */
    private function purchaseOrderPayload(PurchaseOrder $purchaseOrder): array
    {
        return [
            'id' => $purchaseOrder->id,
            'po_number' => $purchaseOrder->po_number,
            'supplier' => [
                'id' => $purchaseOrder->supplier->id,
                'label' => "{$purchaseOrder->supplier->supplier_code} - {$purchaseOrder->supplier->company_name}",
            ],
            'purchase_requisition' => $purchaseOrder->purchaseRequisition ? [
                'id' => $purchaseOrder->purchaseRequisition->id,
                'label' => $purchaseOrder->purchaseRequisition->requisition_number,
            ] : null,
            'order_date' => $purchaseOrder->order_date?->format('Y-m-d'),
            'expected_delivery_date' => $purchaseOrder->expected_delivery_date?->format('Y-m-d'),
            'total_amount' => (float) $purchaseOrder->total_amount,
            'status' => $purchaseOrder->status,
            'created_by' => $purchaseOrder->creator?->name,
            'approved_by' => $purchaseOrder->approver?->name,
            'approved_at' => $purchaseOrder->approved_at?->format('Y-m-d H:i'),
            'remarks' => $purchaseOrder->remarks,
            'approval_remarks' => $purchaseOrder->approval_remarks,
            'lines' => $purchaseOrder->lines->map(fn ($line): array => [
                'id' => $line->id,
                'item' => $line->item ? "{$line->item->item_code} - {$line->item->name}" : null,
                'item_description' => $line->item_description,
                'quantity_ordered' => (float) $line->quantity_ordered,
                'unit_of_measure' => $line->unit_of_measure,
                'unit_cost' => (float) $line->unit_cost,
                'line_total' => (float) $line->quantity_ordered * (float) $line->unit_cost,
                'remarks' => $line->remarks,
            ])->values(),
        ];
    }
}
