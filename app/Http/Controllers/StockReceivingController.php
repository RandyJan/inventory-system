<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockReceivingRequest;
use App\Models\StockReceiving;
use App\Services\StockReceivingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockReceivingController extends Controller
{
    public function __construct(private readonly StockReceivingService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('stock-receivings/index', [
            'receivings' => $this->service->receivings($request->only(['search', 'supplier_id']))
                ->through(fn (StockReceiving $receiving): array => [
                    'id' => $receiving->id,
                    'receiving_number' => $receiving->receiving_number,
                    'supplier' => [
                        'id' => $receiving->supplier->id,
                        'label' => "{$receiving->supplier->supplier_code} - {$receiving->supplier->company_name}",
                    ],
                    'delivery_date' => $receiving->delivery_date?->format('Y-m-d'),
                    'purchase_order_reference' => $receiving->purchase_order_reference,
                    'received_by' => $receiving->receiver?->name,
                    'total_quantity_received' => (float) $receiving->total_quantity_received,
                    'remarks' => $receiving->remarks,
                    'lines' => $receiving->lines->map(fn ($line): array => [
                        'id' => $line->id,
                        'item' => "{$line->item->item_code} - {$line->item->name}",
                        'quantity_received' => (float) $line->quantity_received,
                        'unit_of_measure' => $line->unit_of_measure,
                        'remarks' => $line->remarks,
                    ])->values(),
                ]),
            'summary' => $this->service->summary(),
            'suppliers' => $this->service->suppliers(),
            'items' => $this->service->items(),
            'filters' => $request->only(['search', 'supplier_id']),
        ]);
    }

    public function store(StoreStockReceivingRequest $request): RedirectResponse
    {
        $this->service->record($request->validated(), $request->user());

        return back()->with('success', 'Stock receiving recorded and inventory updated.');
    }
}
