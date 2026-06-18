<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockIssuanceRequest;
use App\Models\StockIssuance;
use App\Services\StockIssuanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockIssuanceController extends Controller
{
    public function __construct(private readonly StockIssuanceService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('stock-issuances/index', [
            'issuances' => $this->service->issuances($request->only(['search', 'department']))
                ->through(fn (StockIssuance $issuance): array => [
                    'id' => $issuance->id,
                    'issue_number' => $issuance->issue_number,
                    'requesting_department' => $issuance->requesting_department,
                    'requestor' => $issuance->requestor,
                    'date_issued' => $issuance->date_issued?->format('Y-m-d'),
                    'released_by' => $issuance->releaser?->name,
                    'total_quantity_issued' => (float) $issuance->total_quantity_issued,
                    'lines' => $issuance->lines->map(fn ($line): array => [
                        'id' => $line->id,
                        'item' => "{$line->item->item_code} - {$line->item->name}",
                        'quantity_issued' => (float) $line->quantity_issued,
                        'unit_of_measure' => $line->unit_of_measure,
                    ])->values(),
                ]),
            'summary' => $this->service->summary(),
            'departments' => $this->service->departments(),
            'items' => $this->service->items(),
            'filters' => $request->only(['search', 'department']),
        ]);
    }

    public function store(StoreStockIssuanceRequest $request): RedirectResponse
    {
        $this->service->record($request->validated(), $request->user());

        return back()->with('success', 'Stock issuance recorded and inventory updated.');
    }
}
