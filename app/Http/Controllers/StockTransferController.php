<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApproveStockTransferRequest;
use App\Http\Requests\RejectStockTransferRequest;
use App\Http\Requests\StoreStockTransferRequest;
use App\Models\StockTransfer;
use App\Services\StockTransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockTransferController extends Controller
{
    public function __construct(private readonly StockTransferService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('stock-transfers/index', [
            'transfers' => $this->service->transfers($request->only(['search', 'status']))
                ->through(fn (StockTransfer $transfer): array => $this->transferPayload($transfer)),
            'summary' => $this->service->summary(),
            'warehouses' => $this->service->warehouses(),
            'locations' => $this->service->locations(),
            'items' => $this->service->items(),
            'statuses' => StockTransfer::STATUSES,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(StoreStockTransferRequest $request): RedirectResponse
    {
        $this->service->request($request->validated(), $request->user());

        return back()->with('success', 'Stock transfer request submitted for approval.');
    }

    public function approve(ApproveStockTransferRequest $request, StockTransfer $stockTransfer): RedirectResponse
    {
        $this->service->approve($stockTransfer, $request->validated(), $request->user());

        return back()->with('success', 'Stock transfer approved and destination warehouse updated.');
    }

    public function reject(RejectStockTransferRequest $request, StockTransfer $stockTransfer): RedirectResponse
    {
        $this->service->reject($stockTransfer, $request->validated(), $request->user());

        return back()->with('success', 'Stock transfer rejected.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transferPayload(StockTransfer $transfer): array
    {
        return [
            'id' => $transfer->id,
            'transfer_number' => $transfer->transfer_number,
            'source_warehouse' => [
                'id' => $transfer->sourceWarehouse->id,
                'label' => "{$transfer->sourceWarehouse->warehouse_code} - {$transfer->sourceWarehouse->name}",
            ],
            'destination_warehouse' => [
                'id' => $transfer->destinationWarehouse->id,
                'label' => "{$transfer->destinationWarehouse->warehouse_code} - {$transfer->destinationWarehouse->name}",
            ],
            'destination_location' => $transfer->destinationLocation ? [
                'id' => $transfer->destinationLocation->id,
                'label' => "{$transfer->destinationLocation->location_code} - {$transfer->destinationLocation->name}",
            ] : null,
            'requested_by' => $transfer->requester?->name,
            'approved_by' => $transfer->approver?->name,
            'requested_date' => $transfer->requested_date?->format('Y-m-d'),
            'approved_date' => $transfer->approved_date?->format('Y-m-d'),
            'status' => $transfer->status,
            'total_quantity_transferred' => (float) $transfer->total_quantity_transferred,
            'remarks' => $transfer->remarks,
            'approval_remarks' => $transfer->approval_remarks,
            'lines' => $transfer->lines->map(fn ($line): array => [
                'id' => $line->id,
                'item' => "{$line->item->item_code} - {$line->item->name}",
                'quantity_transferred' => (float) $line->quantity_transferred,
                'unit_of_measure' => $line->unit_of_measure,
            ])->values(),
        ];
    }
}
