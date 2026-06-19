<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStockCountRequest;
use App\Models\StockCount;
use App\Services\StockCountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockCountController extends Controller
{
    public function __construct(private readonly StockCountService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('stock-counts/index', [
            'counts' => $this->service->counts($request->only(['search', 'count_type', 'variance']))
                ->through(fn (StockCount $stockCount): array => $this->countPayload($stockCount)),
            'summary' => $this->service->summary(),
            'items' => $this->service->items(),
            'types' => StockCount::TYPES,
            'filters' => $request->only(['search', 'count_type', 'variance']),
        ]);
    }

    public function store(StoreStockCountRequest $request): RedirectResponse
    {
        $this->service->record($request->validated(), $request->user());

        return back()->with('success', 'Stock count recorded and variance report generated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function countPayload(StockCount $stockCount): array
    {
        return [
            'id' => $stockCount->id,
            'count_number' => $stockCount->count_number,
            'count_type' => $stockCount->count_type,
            'count_date' => $stockCount->count_date?->format('Y-m-d'),
            'counted_by' => $stockCount->counter?->name,
            'total_items_counted' => $stockCount->total_items_counted,
            'variance_items_count' => $stockCount->variance_items_count,
            'total_absolute_variance' => (float) $stockCount->total_absolute_variance,
            'remarks' => $stockCount->remarks,
            'lines' => $stockCount->lines->map(fn ($line): array => [
                'id' => $line->id,
                'item' => "{$line->item->item_code} - {$line->item->name}",
                'system_quantity' => (float) $line->system_quantity,
                'actual_quantity' => (float) $line->actual_quantity,
                'variance_quantity' => (float) $line->variance_quantity,
                'unit_of_measure' => $line->unit_of_measure,
                'recommendation' => $line->recommendation,
                'remarks' => $line->remarks,
            ])->values(),
        ];
    }
}
