<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryAdjustmentRequest;
use App\Models\InventoryAdjustment;
use App\Services\InventoryAdjustmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryAdjustmentController extends Controller
{
    public function __construct(private readonly InventoryAdjustmentService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('inventory-adjustments/index', [
            'adjustments' => $this->service->adjustments($request->only(['search', 'adjustment_type', 'reason']))
                ->through(fn (InventoryAdjustment $adjustment): array => $this->adjustmentPayload($adjustment)),
            'summary' => $this->service->summary(),
            'items' => $this->service->items(),
            'types' => InventoryAdjustment::TYPES,
            'reasons' => InventoryAdjustment::REASONS,
            'filters' => $request->only(['search', 'adjustment_type', 'reason']),
        ]);
    }

    public function store(StoreInventoryAdjustmentRequest $request): RedirectResponse
    {
        $this->service->record($request->validated(), $request->user());

        return back()->with('success', 'Inventory adjustment recorded and stock quantity updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function adjustmentPayload(InventoryAdjustment $adjustment): array
    {
        return [
            'id' => $adjustment->id,
            'adjustment_number' => $adjustment->adjustment_number,
            'adjustment_type' => $adjustment->adjustment_type,
            'reason' => $adjustment->reason,
            'adjustment_date' => $adjustment->adjustment_date?->format('Y-m-d'),
            'adjusted_by' => $adjustment->adjuster?->name,
            'total_quantity_adjusted' => (float) $adjustment->total_quantity_adjusted,
            'remarks' => $adjustment->remarks,
            'lines' => $adjustment->lines->map(fn ($line): array => [
                'id' => $line->id,
                'item' => "{$line->item->item_code} - {$line->item->name}",
                'quantity_adjusted' => (float) $line->quantity_adjusted,
                'quantity_before' => (float) $line->quantity_before,
                'quantity_after' => (float) $line->quantity_after,
                'unit_of_measure' => $line->unit_of_measure,
                'remarks' => $line->remarks,
            ])->values(),
        ];
    }
}
