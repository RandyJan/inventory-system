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

class ReportCatalogService
{
    /**
     * @return array{groups: array<int, array{key: string, title: string, description: string, reports: array<int, array<string, mixed>>}>, summary: array<string, int>}
     */
    public function catalog(): array
    {
        $groups = [
            [
                'key' => 'inventory',
                'title' => 'Available Reports',
                'description' => 'Inventory position, movement, valuation, item ledger, warehouse, expiry, and damaged stock reports.',
                'reports' => [
                    $this->report('inventory-summary', 'Inventory Summary Report', 'Current stock position, low stock, out of stock, and inventory value.', 'Inventory', Item::query()->active()->count(), 'ready'),
                    $this->report('stock-card', 'Stock Card Report', 'Per-item running stock card based on receiving, issuance, transfer, adjustment, and count records.', 'Inventory', $this->stockMovementCount(), 'ready'),
                    $this->report('inventory-valuation', 'Inventory Valuation Report', 'Quantity on hand multiplied by standard cost for active stock items.', 'Inventory', Item::query()->active()->whereNotNull('standard_cost')->count(), 'ready', $this->currentInventoryValue()),
                    $this->report('stock-movement', 'Stock Movement Report', 'Combined receiving, issuance, transfer, and adjustment activity.', 'Inventory', $this->stockMovementCount(), 'ready'),
                    $this->report('item-ledger', 'Item Ledger Report', 'Item-level transaction ledger for audit and reconciliation review.', 'Inventory', $this->stockMovementLineCount(), 'ready'),
                    $this->report('warehouse-inventory', 'Warehouse Inventory Report', 'Inventory grouped by warehouse and storage location.', 'Warehouse', Warehouse::query()->count(), 'ready'),
                    $this->report('expiring-items', 'Expiring Items Report', 'Items nearing expiration once item expiry dates are captured.', 'Inventory', 0, 'needs-data'),
                    $this->report('damaged-items', 'Damaged Items Report', 'Damaged inventory adjustments and affected item quantities.', 'Inventory', InventoryAdjustment::query()->where('adjustment_type', InventoryAdjustment::TYPE_DAMAGED)->count(), 'ready'),
                ],
            ],
            [
                'key' => 'purchasing',
                'title' => 'Purchasing Reports',
                'description' => 'Supplier performance, purchase history, purchase order, and receiving reports.',
                'reports' => [
                    $this->report('supplier-performance', 'Supplier Performance Report', 'Supplier score, fulfilled orders, late deliveries, and current status.', 'Purchasing', Supplier::query()->count(), 'ready'),
                    $this->report('purchase-history', 'Purchase History Report', 'Historical purchase order lines and ordered quantities.', 'Purchasing', PurchaseOrderLine::query()->count(), 'ready'),
                    $this->report('purchase-order', 'Purchase Order Report', 'Purchase orders by supplier, status, amount, order date, and approval state.', 'Purchasing', PurchaseOrder::query()->count(), 'ready'),
                    $this->report('receiving', 'Receiving Report', 'Stock receiving transactions and quantities received by supplier.', 'Receiving', StockReceiving::query()->count(), 'ready'),
                ],
            ],
            [
                'key' => 'issuance',
                'title' => 'Issuance Reports',
                'description' => 'Department consumption, issuance history, and monthly consumption reports.',
                'reports' => [
                    $this->report('department-consumption', 'Department Consumption Report', 'Issued quantities summarized by requesting department.', 'Issuance', StockIssuance::query()->distinct('requesting_department')->count('requesting_department'), 'ready'),
                    $this->report('issuance-history', 'Issuance History Report', 'Full stock issuance history by issue number, requester, department, and item.', 'Issuance', StockIssuance::query()->count(), 'ready'),
                    $this->report('monthly-consumption', 'Monthly Consumption Report', 'Issued item quantities grouped by month for consumption trend review.', 'Issuance', StockIssuanceLine::query()->count(), 'ready'),
                ],
            ],
            [
                'key' => 'audit',
                'title' => 'Audit Reports',
                'description' => 'Inventory adjustments, physical count variance, and user activity reports.',
                'reports' => [
                    $this->report('adjustment', 'Adjustment Report', 'Inventory adjustments by type, reason, user, item, and quantity changed.', 'Audit', InventoryAdjustment::query()->count(), 'ready'),
                    $this->report('physical-count-variance', 'Physical Count Variance Report', 'Stock count lines where system and actual quantities differ.', 'Audit', StockCountLine::query()->where('variance_quantity', '!=', 0)->count(), 'ready'),
                    $this->report('user-activity', 'User Activity Report', 'Authentication, user management, role, permission, and inventory audit activity.', 'Audit', Activity::query()->count(), 'ready'),
                ],
            ],
        ];

        return [
            'groups' => $groups,
            'summary' => [
                'total_reports' => collect($groups)->sum(fn (array $group): int => count($group['reports'])),
                'ready_reports' => collect($groups)->sum(fn (array $group): int => collect($group['reports'])->where('status', 'ready')->count()),
                'needs_data_reports' => collect($groups)->sum(fn (array $group): int => collect($group['reports'])->where('status', 'needs-data')->count()),
                'total_records' => collect($groups)->sum(fn (array $group): int => collect($group['reports'])->sum('records_count')),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $slug): ?array
    {
        return collect($this->catalog()['groups'])
            ->flatMap(fn (array $group): array => $group['reports'])
            ->firstWhere('slug', $slug);
    }

    /**
     * @return array{slug: string, name: string, description: string, source: string, records_count: int, status: string, value: float|null}
     */
    private function report(
        string $slug,
        string $name,
        string $description,
        string $source,
        int $recordsCount,
        string $status,
        ?float $value = null
    ): array {
        return [
            'slug' => $slug,
            'name' => $name,
            'description' => $description,
            'source' => $source,
            'records_count' => $recordsCount,
            'status' => $status,
            'value' => $value,
        ];
    }

    private function currentInventoryValue(): float
    {
        return round((float) Item::query()
            ->active()
            ->selectRaw('COALESCE(SUM(quantity_on_hand * standard_cost), 0) as value')
            ->value('value'), 2);
    }

    private function stockMovementCount(): int
    {
        return StockReceiving::query()->count()
            + StockIssuance::query()->count()
            + StockTransfer::query()->count()
            + InventoryAdjustment::query()->count();
    }

    private function stockMovementLineCount(): int
    {
        return StockReceivingLine::query()->count()
            + StockIssuanceLine::query()->count()
            + StockTransferLine::query()->count()
            + InventoryAdjustmentLine::query()->count();
    }
}
