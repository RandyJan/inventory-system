<?php

namespace App\Services;

use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentLine;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\StockCountLine;
use App\Models\StockIssuance;
use App\Models\StockIssuanceLine;
use App\Models\StockReceiving;
use App\Models\StockReceivingLine;
use App\Models\StockTransfer;
use App\Models\StockTransferLine;
use App\Models\Supplier;
use App\Models\Warehouse;
use Spatie\Activitylog\Models\Activity;

class ReportDataService
{
    public function __construct(private readonly ReportCatalogService $catalog) {}

    /**
     * @return array{report: array<string, mixed>, columns: array<int, array{key: string, label: string, align?: string}>, rows: array<int, array<string, mixed>>, summary: array<int, array{label: string, value: string|int|float}>, generated_at: string, export_filename: string}
     */
    public function detail(string $slug): array
    {
        $report = $this->catalog->find($slug);

        abort_if($report === null, 404);

        $data = match ($slug) {
            'inventory-summary' => $this->inventorySummary(),
            'stock-card' => $this->stockCard(),
            'inventory-valuation' => $this->inventoryValuation(),
            'stock-movement' => $this->stockMovement(),
            'item-ledger' => $this->itemLedger(),
            'warehouse-inventory' => $this->warehouseInventory(),
            'expiring-items' => $this->expiringItems(),
            'damaged-items' => $this->damagedItems(),
            'supplier-performance' => $this->supplierPerformance(),
            'purchase-history' => $this->purchaseHistory(),
            'purchase-order' => $this->purchaseOrder(),
            'receiving' => $this->receiving(),
            'department-consumption' => $this->departmentConsumption(),
            'issuance-history' => $this->issuanceHistory(),
            'monthly-consumption' => $this->monthlyConsumption(),
            'adjustment' => $this->adjustment(),
            'physical-count-variance' => $this->physicalCountVariance(),
            'user-activity' => $this->userActivity(),
            default => abort(404),
        };

        return [
            'report' => $report,
            'columns' => $data['columns'],
            'rows' => $data['rows'],
            'summary' => $data['summary'],
            'generated_at' => now()->toIso8601String(),
            'export_filename' => $slug.'-'.now()->format('Ymd-His').'.csv',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function exportRows(string $slug): array
    {
        return $this->detail($slug)['rows'];
    }

    /**
     * @return array<int, array{key: string, label: string, align?: string}>
     */
    public function exportColumns(string $slug): array
    {
        return $this->detail($slug)['columns'];
    }

    /**
     * @return array{columns: array<int, array{key: string, label: string, align?: string}>, rows: array<int, array<string, mixed>>, summary: array<int, array{label: string, value: string|int|float}>}
     */
    private function inventorySummary(): array
    {
        $rows = Item::query()
            ->with(['inventoryCategory:id,name', 'warehouse:id,warehouse_code,name', 'warehouseLocation:id,location_code,name'])
            ->active()
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (Item $item): array => [
                'item_code' => $item->item_code,
                'item' => $item->name,
                'category' => $item->inventoryCategory?->name ?? $item->category,
                'warehouse' => $item->warehouse?->name ?? 'Unassigned',
                'location' => $item->warehouseLocation?->location_code ?? 'Unassigned',
                'quantity_on_hand' => (float) $item->quantity_on_hand,
                'reorder_level' => (float) $item->reorder_level,
                'status' => $this->stockStatus($item),
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'warehouse', 'label' => 'Warehouse'],
                ['key' => 'location', 'label' => 'Location'],
                ['key' => 'quantity_on_hand', 'label' => 'Qty On Hand', 'align' => 'right'],
                ['key' => 'reorder_level', 'label' => 'Reorder Level', 'align' => 'right'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            $rows,
            [
                ['label' => 'Active Items', 'value' => Item::query()->active()->count()],
                ['label' => 'Low Stock', 'value' => Item::query()->active()->where('quantity_on_hand', '>', 0)->whereColumn('quantity_on_hand', '<=', 'reorder_level')->count()],
                ['label' => 'Out of Stock', 'value' => Item::query()->active()->where('quantity_on_hand', '<=', 0)->count()],
            ]
        );
    }

    private function stockCard(): array
    {
        return $this->movementLines('Stock Card Report');
    }

    private function inventoryValuation(): array
    {
        $rows = Item::query()
            ->active()
            ->orderBy('name')
            ->limit(500)
            ->get(['item_code', 'name', 'quantity_on_hand', 'standard_cost'])
            ->map(fn (Item $item): array => [
                'item_code' => $item->item_code,
                'item' => $item->name,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
                'standard_cost' => (float) ($item->standard_cost ?? 0),
                'inventory_value' => round((float) $item->quantity_on_hand * (float) ($item->standard_cost ?? 0), 2),
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_on_hand', 'label' => 'Qty On Hand', 'align' => 'right'],
                ['key' => 'standard_cost', 'label' => 'Standard Cost', 'align' => 'right'],
                ['key' => 'inventory_value', 'label' => 'Inventory Value', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => 'Valued Items', 'value' => count($rows)],
                ['label' => 'Total Value', 'value' => round(collect($rows)->sum('inventory_value'), 2)],
            ]
        );
    }

    private function stockMovement(): array
    {
        return $this->movementTransactions();
    }

    private function itemLedger(): array
    {
        return $this->movementLines('Item Ledger Report');
    }

    private function warehouseInventory(): array
    {
        $rows = Item::query()
            ->with(['warehouse:id,warehouse_code,name', 'warehouseLocation:id,location_code,name'])
            ->active()
            ->orderBy('warehouse_id')
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn (Item $item): array => [
                'warehouse' => $item->warehouse?->name ?? 'Unassigned',
                'warehouse_code' => $item->warehouse?->warehouse_code ?? 'N/A',
                'location' => $item->warehouseLocation?->location_code ?? 'Unassigned',
                'item_code' => $item->item_code,
                'item' => $item->name,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
                'unit_of_measure' => $item->unit_of_measure,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'warehouse_code', 'label' => 'Warehouse Code'],
                ['key' => 'warehouse', 'label' => 'Warehouse'],
                ['key' => 'location', 'label' => 'Location'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_on_hand', 'label' => 'Qty On Hand', 'align' => 'right'],
                ['key' => 'unit_of_measure', 'label' => 'UOM'],
            ],
            $rows,
            [
                ['label' => 'Warehouses', 'value' => Warehouse::query()->count()],
                ['label' => 'Assigned Items', 'value' => Item::query()->active()->whereNotNull('warehouse_id')->count()],
            ]
        );
    }

    private function expiringItems(): array
    {
        return $this->table(
            [
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'expiration_date', 'label' => 'Expiration Date'],
                ['key' => 'quantity_on_hand', 'label' => 'Qty On Hand', 'align' => 'right'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            [],
            [
                ['label' => 'Data Status', 'value' => 'Item expiry dates are not captured yet'],
            ]
        );
    }

    private function damagedItems(): array
    {
        $rows = InventoryAdjustmentLine::query()
            ->with(['adjustment.adjuster:id,name', 'item:id,item_code,name'])
            ->whereHas('adjustment', fn ($query) => $query->where('adjustment_type', InventoryAdjustment::TYPE_DAMAGED))
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (InventoryAdjustmentLine $line): array => [
                'adjustment_number' => $line->adjustment?->adjustment_number,
                'date' => $line->adjustment?->adjustment_date?->format('Y-m-d'),
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'quantity_adjusted' => (float) $line->quantity_adjusted,
                'quantity_before' => (float) $line->quantity_before,
                'quantity_after' => (float) $line->quantity_after,
                'adjusted_by' => $line->adjustment?->adjuster?->name,
            ])
            ->all();

        return $this->adjustmentLineTable($rows);
    }

    private function supplierPerformance(): array
    {
        $rows = Supplier::query()
            ->orderByDesc('performance_score')
            ->limit(500)
            ->get()
            ->map(fn (Supplier $supplier): array => [
                'supplier_code' => $supplier->supplier_code,
                'supplier' => $supplier->company_name,
                'status' => $supplier->status,
                'total_orders' => $supplier->total_orders,
                'fulfilled_orders' => $supplier->fulfilled_orders,
                'late_deliveries' => $supplier->late_deliveries,
                'performance_score' => (float) ($supplier->performance_score ?? 0),
                'last_delivery_at' => $supplier->last_delivery_at?->format('Y-m-d'),
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'supplier_code', 'label' => 'Supplier Code'],
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'total_orders', 'label' => 'Orders', 'align' => 'right'],
                ['key' => 'fulfilled_orders', 'label' => 'Fulfilled', 'align' => 'right'],
                ['key' => 'late_deliveries', 'label' => 'Late', 'align' => 'right'],
                ['key' => 'performance_score', 'label' => 'Score', 'align' => 'right'],
                ['key' => 'last_delivery_at', 'label' => 'Last Delivery'],
            ],
            $rows,
            [
                ['label' => 'Suppliers', 'value' => count($rows)],
                ['label' => 'Average Score', 'value' => round(collect($rows)->avg('performance_score') ?? 0, 2)],
            ]
        );
    }

    private function purchaseHistory(): array
    {
        $rows = PurchaseOrderLine::query()
            ->with(['purchaseOrder.supplier:id,supplier_code,company_name', 'item:id,item_code,name'])
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (PurchaseOrderLine $line): array => [
                'po_number' => $line->purchaseOrder?->po_number,
                'order_date' => $line->purchaseOrder?->order_date?->format('Y-m-d'),
                'supplier' => $line->purchaseOrder?->supplier?->company_name,
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name ?? $line->item_description,
                'quantity_ordered' => (float) $line->quantity_ordered,
                'unit_cost' => (float) $line->unit_cost,
                'line_total' => round((float) $line->quantity_ordered * (float) $line->unit_cost, 2),
            ])
            ->all();

        return $this->purchaseLineTable($rows);
    }

    private function purchaseOrder(): array
    {
        $rows = PurchaseOrder::query()
            ->with(['supplier:id,supplier_code,company_name', 'creator:id,name', 'approver:id,name'])
            ->latest('order_date')
            ->limit(500)
            ->get()
            ->map(fn (PurchaseOrder $purchaseOrder): array => [
                'po_number' => $purchaseOrder->po_number,
                'supplier' => $purchaseOrder->supplier?->company_name,
                'order_date' => $purchaseOrder->order_date?->format('Y-m-d'),
                'expected_delivery_date' => $purchaseOrder->expected_delivery_date?->format('Y-m-d'),
                'status' => $purchaseOrder->status,
                'total_amount' => (float) $purchaseOrder->total_amount,
                'created_by' => $purchaseOrder->creator?->name,
                'approved_by' => $purchaseOrder->approver?->name,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'po_number', 'label' => 'PO Number'],
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'order_date', 'label' => 'Order Date'],
                ['key' => 'expected_delivery_date', 'label' => 'Expected Delivery'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'total_amount', 'label' => 'Total Amount', 'align' => 'right'],
                ['key' => 'created_by', 'label' => 'Created By'],
                ['key' => 'approved_by', 'label' => 'Approved By'],
            ],
            $rows,
            [
                ['label' => 'Purchase Orders', 'value' => count($rows)],
                ['label' => 'Total Amount', 'value' => round(collect($rows)->sum('total_amount'), 2)],
            ]
        );
    }

    private function receiving(): array
    {
        $rows = StockReceivingLine::query()
            ->with(['stockReceiving.supplier:id,supplier_code,company_name', 'stockReceiving.receiver:id,name', 'item:id,item_code,name'])
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (StockReceivingLine $line): array => [
                'receiving_number' => $line->stockReceiving?->receiving_number,
                'delivery_date' => $line->stockReceiving?->delivery_date?->format('Y-m-d'),
                'supplier' => $line->stockReceiving?->supplier?->company_name,
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'quantity_received' => (float) $line->quantity_received,
                'unit_of_measure' => $line->unit_of_measure,
                'received_by' => $line->stockReceiving?->receiver?->name,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'receiving_number', 'label' => 'Receiving Number'],
                ['key' => 'delivery_date', 'label' => 'Delivery Date'],
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_received', 'label' => 'Qty Received', 'align' => 'right'],
                ['key' => 'unit_of_measure', 'label' => 'UOM'],
                ['key' => 'received_by', 'label' => 'Received By'],
            ],
            $rows,
            [
                ['label' => 'Receiving Lines', 'value' => count($rows)],
                ['label' => 'Total Received', 'value' => round(collect($rows)->sum('quantity_received'), 2)],
            ]
        );
    }

    private function departmentConsumption(): array
    {
        $rows = StockIssuance::query()
            ->select('requesting_department')
            ->selectRaw('COUNT(*) as issuances_count')
            ->selectRaw('COALESCE(SUM(total_quantity_issued), 0) as total_quantity')
            ->groupBy('requesting_department')
            ->orderByDesc('total_quantity')
            ->limit(500)
            ->get()
            ->map(fn (StockIssuance $issuance): array => [
                'department' => $issuance->requesting_department,
                'issuances_count' => (int) $issuance->issuances_count,
                'total_quantity' => (float) $issuance->total_quantity,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'department', 'label' => 'Department'],
                ['key' => 'issuances_count', 'label' => 'Issuances', 'align' => 'right'],
                ['key' => 'total_quantity', 'label' => 'Total Quantity', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => 'Departments', 'value' => count($rows)],
                ['label' => 'Total Issued', 'value' => round(collect($rows)->sum('total_quantity'), 2)],
            ]
        );
    }

    private function issuanceHistory(): array
    {
        $rows = StockIssuanceLine::query()
            ->with(['stockIssuance.releaser:id,name', 'item:id,item_code,name'])
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (StockIssuanceLine $line): array => [
                'issue_number' => $line->stockIssuance?->issue_number,
                'date_issued' => $line->stockIssuance?->date_issued?->format('Y-m-d'),
                'department' => $line->stockIssuance?->requesting_department,
                'requestor' => $line->stockIssuance?->requestor,
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'quantity_issued' => (float) $line->quantity_issued,
                'unit_of_measure' => $line->unit_of_measure,
                'released_by' => $line->stockIssuance?->releaser?->name,
            ])
            ->all();

        return $this->issuanceLineTable($rows);
    }

    private function monthlyConsumption(): array
    {
        $rows = StockIssuance::query()
            ->limit(500)
            ->get()
            ->groupBy(fn (StockIssuance $issuance): string => $issuance->date_issued?->format('Y-m') ?? 'No date')
            ->map(fn ($issuances, string $month): array => [
                'month' => $month,
                'issuances_count' => $issuances->count(),
                'total_quantity' => (float) $issuances->sum('total_quantity_issued'),
            ])
            ->sortByDesc('month')
            ->values()
            ->all();

        return $this->table(
            [
                ['key' => 'month', 'label' => 'Month'],
                ['key' => 'issuances_count', 'label' => 'Issuances', 'align' => 'right'],
                ['key' => 'total_quantity', 'label' => 'Total Quantity', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => 'Months', 'value' => count($rows)],
                ['label' => 'Total Consumed', 'value' => round(collect($rows)->sum('total_quantity'), 2)],
            ]
        );
    }

    private function adjustment(): array
    {
        $rows = InventoryAdjustmentLine::query()
            ->with(['adjustment.adjuster:id,name', 'item:id,item_code,name'])
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (InventoryAdjustmentLine $line): array => [
                'adjustment_number' => $line->adjustment?->adjustment_number,
                'date' => $line->adjustment?->adjustment_date?->format('Y-m-d'),
                'type' => $line->adjustment?->adjustment_type,
                'reason' => $line->adjustment?->reason,
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'quantity_adjusted' => (float) $line->quantity_adjusted,
                'quantity_before' => (float) $line->quantity_before,
                'quantity_after' => (float) $line->quantity_after,
                'adjusted_by' => $line->adjustment?->adjuster?->name,
            ])
            ->all();

        return $this->adjustmentLineTable($rows);
    }

    private function physicalCountVariance(): array
    {
        $rows = StockCountLine::query()
            ->with(['stockCount.counter:id,name', 'item:id,item_code,name'])
            ->where('variance_quantity', '!=', 0)
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (StockCountLine $line): array => [
                'count_number' => $line->stockCount?->count_number,
                'count_date' => $line->stockCount?->count_date?->format('Y-m-d'),
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'system_quantity' => (float) $line->system_quantity,
                'actual_quantity' => (float) $line->actual_quantity,
                'variance_quantity' => (float) $line->variance_quantity,
                'recommendation' => $line->recommendation,
                'counted_by' => $line->stockCount?->counter?->name,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'count_number', 'label' => 'Count Number'],
                ['key' => 'count_date', 'label' => 'Count Date'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'system_quantity', 'label' => 'System Qty', 'align' => 'right'],
                ['key' => 'actual_quantity', 'label' => 'Actual Qty', 'align' => 'right'],
                ['key' => 'variance_quantity', 'label' => 'Variance', 'align' => 'right'],
                ['key' => 'recommendation', 'label' => 'Recommendation'],
                ['key' => 'counted_by', 'label' => 'Counted By'],
            ],
            $rows,
            [
                ['label' => 'Variance Lines', 'value' => count($rows)],
                ['label' => 'Absolute Variance', 'value' => round(collect($rows)->sum(fn (array $row): float => abs((float) $row['variance_quantity'])), 2)],
            ]
        );
    }

    private function userActivity(): array
    {
        $rows = Activity::query()
            ->with('causer')
            ->latest()
            ->limit(500)
            ->get()
            ->map(fn (Activity $activity): array => [
                'date_time' => $activity->created_at?->format('Y-m-d H:i:s'),
                'user' => $activity->causer?->name ?? 'System',
                'category' => $activity->log_name,
                'action' => $activity->event,
                'description' => $activity->description,
                'subject' => class_basename((string) $activity->subject_type),
                'subject_id' => $activity->subject_id,
            ])
            ->all();

        return $this->table(
            [
                ['key' => 'date_time', 'label' => 'Date/Time'],
                ['key' => 'user', 'label' => 'User'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'action', 'label' => 'Action'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'subject', 'label' => 'Subject'],
                ['key' => 'subject_id', 'label' => 'Subject ID', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => 'Activity Records', 'value' => count($rows)],
            ]
        );
    }

    private function movementTransactions(): array
    {
        $rows = collect()
            ->concat(StockReceiving::query()->with('receiver:id,name')->latest()->limit(125)->get()->map(fn (StockReceiving $record): array => [
                'date' => $record->delivery_date?->format('Y-m-d'),
                'type' => 'Receiving',
                'reference' => $record->receiving_number,
                'quantity' => (float) $record->total_quantity_received,
                'actor' => $record->receiver?->name,
                'status' => 'posted',
            ]))
            ->concat(StockIssuance::query()->with('releaser:id,name')->latest()->limit(125)->get()->map(fn (StockIssuance $record): array => [
                'date' => $record->date_issued?->format('Y-m-d'),
                'type' => 'Issuance',
                'reference' => $record->issue_number,
                'quantity' => (float) $record->total_quantity_issued,
                'actor' => $record->releaser?->name,
                'status' => 'posted',
            ]))
            ->concat(StockTransfer::query()->with('requester:id,name')->latest()->limit(125)->get()->map(fn (StockTransfer $record): array => [
                'date' => $record->requested_date?->format('Y-m-d'),
                'type' => 'Transfer',
                'reference' => $record->transfer_number,
                'quantity' => (float) $record->total_quantity_transferred,
                'actor' => $record->requester?->name,
                'status' => $record->status,
            ]))
            ->concat(InventoryAdjustment::query()->with('adjuster:id,name')->latest()->limit(125)->get()->map(fn (InventoryAdjustment $record): array => [
                'date' => $record->adjustment_date?->format('Y-m-d'),
                'type' => 'Adjustment',
                'reference' => $record->adjustment_number,
                'quantity' => (float) $record->total_quantity_adjusted,
                'actor' => $record->adjuster?->name,
                'status' => $record->adjustment_type,
            ]))
            ->sortByDesc('date')
            ->values()
            ->all();

        return $this->table(
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'reference', 'label' => 'Reference'],
                ['key' => 'quantity', 'label' => 'Quantity', 'align' => 'right'],
                ['key' => 'actor', 'label' => 'User'],
                ['key' => 'status', 'label' => 'Status'],
            ],
            $rows,
            [
                ['label' => 'Transactions', 'value' => count($rows)],
                ['label' => 'Total Quantity', 'value' => round(collect($rows)->sum('quantity'), 2)],
            ]
        );
    }

    private function movementLines(string $title): array
    {
        $rows = collect()
            ->concat(StockReceivingLine::query()->with(['stockReceiving', 'item:id,item_code,name'])->latest()->limit(125)->get()->map(fn (StockReceivingLine $line): array => [
                'date' => $line->stockReceiving?->delivery_date?->format('Y-m-d'),
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'reference' => $line->stockReceiving?->receiving_number,
                'movement' => 'Received',
                'quantity_in' => (float) $line->quantity_received,
                'quantity_out' => 0,
                'balance' => '',
            ]))
            ->concat(StockIssuanceLine::query()->with(['stockIssuance', 'item:id,item_code,name'])->latest()->limit(125)->get()->map(fn (StockIssuanceLine $line): array => [
                'date' => $line->stockIssuance?->date_issued?->format('Y-m-d'),
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'reference' => $line->stockIssuance?->issue_number,
                'movement' => 'Issued',
                'quantity_in' => 0,
                'quantity_out' => (float) $line->quantity_issued,
                'balance' => '',
            ]))
            ->concat(InventoryAdjustmentLine::query()->with(['adjustment', 'item:id,item_code,name'])->latest()->limit(125)->get()->map(fn (InventoryAdjustmentLine $line): array => [
                'date' => $line->adjustment?->adjustment_date?->format('Y-m-d'),
                'item_code' => $line->item?->item_code,
                'item' => $line->item?->name,
                'reference' => $line->adjustment?->adjustment_number,
                'movement' => 'Adjusted',
                'quantity_in' => max((float) $line->quantity_after - (float) $line->quantity_before, 0),
                'quantity_out' => max((float) $line->quantity_before - (float) $line->quantity_after, 0),
                'balance' => (float) $line->quantity_after,
            ]))
            ->sortByDesc('date')
            ->values()
            ->all();

        return $this->table(
            [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'reference', 'label' => 'Reference'],
                ['key' => 'movement', 'label' => 'Movement'],
                ['key' => 'quantity_in', 'label' => 'Qty In', 'align' => 'right'],
                ['key' => 'quantity_out', 'label' => 'Qty Out', 'align' => 'right'],
                ['key' => 'balance', 'label' => 'Balance', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => $title === 'Stock Card Report' ? 'Stock Card Lines' : 'Ledger Lines', 'value' => count($rows)],
            ]
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function adjustmentLineTable(array $rows): array
    {
        return $this->table(
            [
                ['key' => 'adjustment_number', 'label' => 'Adjustment Number'],
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'reason', 'label' => 'Reason'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_adjusted', 'label' => 'Qty Adjusted', 'align' => 'right'],
                ['key' => 'quantity_before', 'label' => 'Qty Before', 'align' => 'right'],
                ['key' => 'quantity_after', 'label' => 'Qty After', 'align' => 'right'],
                ['key' => 'adjusted_by', 'label' => 'Adjusted By'],
            ],
            $rows,
            [
                ['label' => 'Adjustment Lines', 'value' => count($rows)],
                ['label' => 'Total Adjusted', 'value' => round(collect($rows)->sum('quantity_adjusted'), 2)],
            ]
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function purchaseLineTable(array $rows): array
    {
        return $this->table(
            [
                ['key' => 'po_number', 'label' => 'PO Number'],
                ['key' => 'order_date', 'label' => 'Order Date'],
                ['key' => 'supplier', 'label' => 'Supplier'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_ordered', 'label' => 'Qty Ordered', 'align' => 'right'],
                ['key' => 'unit_cost', 'label' => 'Unit Cost', 'align' => 'right'],
                ['key' => 'line_total', 'label' => 'Line Total', 'align' => 'right'],
            ],
            $rows,
            [
                ['label' => 'Purchase Lines', 'value' => count($rows)],
                ['label' => 'Total Ordered', 'value' => round(collect($rows)->sum('quantity_ordered'), 2)],
                ['label' => 'Total Cost', 'value' => round(collect($rows)->sum('line_total'), 2)],
            ]
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function issuanceLineTable(array $rows): array
    {
        return $this->table(
            [
                ['key' => 'issue_number', 'label' => 'Issue Number'],
                ['key' => 'date_issued', 'label' => 'Date Issued'],
                ['key' => 'department', 'label' => 'Department'],
                ['key' => 'requestor', 'label' => 'Requestor'],
                ['key' => 'item_code', 'label' => 'Item Code'],
                ['key' => 'item', 'label' => 'Item'],
                ['key' => 'quantity_issued', 'label' => 'Qty Issued', 'align' => 'right'],
                ['key' => 'unit_of_measure', 'label' => 'UOM'],
                ['key' => 'released_by', 'label' => 'Released By'],
            ],
            $rows,
            [
                ['label' => 'Issuance Lines', 'value' => count($rows)],
                ['label' => 'Total Issued', 'value' => round(collect($rows)->sum('quantity_issued'), 2)],
            ]
        );
    }

    /**
     * @param  array<int, array{key: string, label: string, align?: string}>  $columns
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array{label: string, value: string|int|float}>  $summary
     * @return array{columns: array<int, array{key: string, label: string, align?: string}>, rows: array<int, array<string, mixed>>, summary: array<int, array{label: string, value: string|int|float}>}
     */
    private function table(array $columns, array $rows, array $summary): array
    {
        return [
            'columns' => $columns,
            'rows' => $rows,
            'summary' => $summary,
        ];
    }

    private function stockStatus(Item $item): string
    {
        if ((float) $item->quantity_on_hand <= 0) {
            return 'Out of stock';
        }

        if ((float) $item->quantity_on_hand <= (float) $item->reorder_level) {
            return 'Low stock';
        }

        return 'Available';
    }
}
