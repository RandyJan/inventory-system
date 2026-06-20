<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\ApprovalWorkflowController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryCategory\IndexController as InventoryCategoryIndexController;
use App\Http\Controllers\InventoryCategory\StoreController as InventoryCategoryStoreController;
use App\Http\Controllers\InventoryCategory\UpdateController as InventoryCategoryUpdateController;
use App\Http\Controllers\InventoryAdjustmentController;
use App\Http\Controllers\Item\CreateController as ItemCreateController;
use App\Http\Controllers\Item\DestroyController as ItemDestroyController;
use App\Http\Controllers\Item\EditController as ItemEditController;
use App\Http\Controllers\Item\IndexController as ItemIndexController;
use App\Http\Controllers\Item\ShowController as ItemShowController;
use App\Http\Controllers\Item\StoreController as ItemStoreController;
use App\Http\Controllers\Item\UpdateController as ItemUpdateController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PermissionManagementController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseRequisitionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleManagementController;
use App\Http\Controllers\StockIssuanceController;
use App\Http\Controllers\StockCountController;
use App\Http\Controllers\StockReceivingController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\SupplierManagementController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\WarehouseManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (request()->user() === null) {
        return redirect()->route('login');
    }

    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)
        ->middleware('can:dashboard.view')
        ->name('dashboard');

    Route::get('reports', ReportController::class)
        ->middleware('can:reports.view')
        ->name('reports.index');
    Route::get('reports/{report}', [ReportController::class, 'show'])
        ->middleware('can:reports.view')
        ->name('reports.show');
    Route::get('reports/{report}/export', [ReportController::class, 'export'])
        ->middleware('can:reports.view')
        ->name('reports.export');

    // Debug pages
    Route::get('debug/notifications', function () {
        return Inertia::render('debug/notifications');
    })->name('debug.notifications');

    Route::get('users', [UserManagementController::class, 'index'])
        ->middleware('can:users.view')
        ->name('users.index');
    Route::patch('users/{user}/role', [UserManagementController::class, 'updateRole'])
        ->middleware('can:users.update')
        ->name('users.update-role');
    Route::patch('users/{user}/activate', [UserManagementController::class, 'activate'])
        ->middleware('can:users.update')
        ->name('users.activate');
    Route::patch('users/{user}/deactivate', [UserManagementController::class, 'deactivate'])
        ->middleware('can:users.update')
        ->name('users.deactivate');

    Route::get('roles', [RoleManagementController::class, 'index'])
        ->middleware('can:roles.view')
        ->name('roles.index');
    Route::post('roles', [RoleManagementController::class, 'store'])
        ->middleware('can:roles.create')
        ->name('roles.store');
    Route::put('roles/{role}', [RoleManagementController::class, 'update'])
        ->middleware('can:roles.update')
        ->name('roles.update');
    Route::delete('roles/{role}', [RoleManagementController::class, 'destroy'])
        ->middleware('can:roles.delete')
        ->name('roles.destroy');

    Route::get('permissions', [PermissionManagementController::class, 'index'])
        ->middleware('can:permissions.view')
        ->name('permissions.index');
    Route::post('permissions', [PermissionManagementController::class, 'store'])
        ->middleware('can:permissions.create')
        ->name('permissions.store');
    Route::put('permissions/{permission}', [PermissionManagementController::class, 'update'])
        ->middleware('can:permissions.update')
        ->name('permissions.update');
    Route::delete('permissions/{permission}', [PermissionManagementController::class, 'destroy'])
        ->middleware('can:permissions.delete')
        ->name('permissions.destroy');

    Route::get('approval-workflows', [ApprovalWorkflowController::class, 'index'])
        ->middleware('can:approval-workflows.view')
        ->name('approval-workflows.index');
    Route::post('approval-workflows', [ApprovalWorkflowController::class, 'store'])
        ->middleware('can:approval-workflows.manage')
        ->name('approval-workflows.store');
    Route::put('approval-workflows/{approvalWorkflow}', [ApprovalWorkflowController::class, 'update'])
        ->middleware('can:approval-workflows.manage')
        ->name('approval-workflows.update');

    Route::get('suppliers', [SupplierManagementController::class, 'index'])
        ->middleware('can:suppliers.view')
        ->name('suppliers.index');
    Route::post('suppliers', [SupplierManagementController::class, 'store'])
        ->middleware('can:suppliers.create')
        ->name('suppliers.store');
    Route::put('suppliers/{supplier}', [SupplierManagementController::class, 'update'])
        ->middleware('can:suppliers.update')
        ->name('suppliers.update');

    Route::get('purchase-requisitions', [PurchaseRequisitionController::class, 'index'])
        ->middleware('can:purchase-requisitions.view')
        ->name('purchase-requisitions.index');
    Route::post('purchase-requisitions', [PurchaseRequisitionController::class, 'store'])
        ->middleware('can:purchase-requisitions.create')
        ->name('purchase-requisitions.store');
    Route::post('purchase-requisitions/{purchaseRequisition}/submit', [PurchaseRequisitionController::class, 'submit'])
        ->middleware('can:purchase-requisitions.submit')
        ->name('purchase-requisitions.submit');
    Route::post('purchase-requisitions/{purchaseRequisition}/approve', [PurchaseRequisitionController::class, 'approve'])
        ->middleware('can:purchase-requisitions.approve')
        ->name('purchase-requisitions.approve');
    Route::post('purchase-requisitions/{purchaseRequisition}/reject', [PurchaseRequisitionController::class, 'reject'])
        ->middleware('can:purchase-requisitions.approve')
        ->name('purchase-requisitions.reject');
    Route::post('purchase-requisitions/{purchaseRequisition}/convert', [PurchaseRequisitionController::class, 'convert'])
        ->middleware('can:purchase-requisitions.convert')
        ->name('purchase-requisitions.convert');

    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])
        ->middleware('can:purchase-orders.view')
        ->name('purchase-orders.index');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])
        ->middleware('can:purchase-orders.create')
        ->name('purchase-orders.store');
    Route::post('purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])
        ->middleware('can:purchase-orders.submit')
        ->name('purchase-orders.submit');
    Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])
        ->middleware('can:purchase-orders.approve')
        ->name('purchase-orders.approve');
    Route::post('purchase-orders/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])
        ->middleware('can:purchase-orders.approve')
        ->name('purchase-orders.reject');

    Route::get('stock-receivings', [StockReceivingController::class, 'index'])
        ->middleware('can:stock-receivings.view')
        ->name('stock-receivings.index');
    Route::post('stock-receivings', [StockReceivingController::class, 'store'])
        ->middleware('can:stock-receivings.create')
        ->name('stock-receivings.store');

    Route::get('stock-issuances', [StockIssuanceController::class, 'index'])
        ->middleware('can:stock-issuances.view')
        ->name('stock-issuances.index');
    Route::post('stock-issuances', [StockIssuanceController::class, 'store'])
        ->middleware('can:stock-issuances.create')
        ->name('stock-issuances.store');

    Route::get('stock-transfers', [StockTransferController::class, 'index'])
        ->middleware('can:stock-transfers.view')
        ->name('stock-transfers.index');
    Route::post('stock-transfers', [StockTransferController::class, 'store'])
        ->middleware('can:stock-transfers.create')
        ->name('stock-transfers.store');
    Route::post('stock-transfers/{stockTransfer}/approve', [StockTransferController::class, 'approve'])
        ->name('stock-transfers.approve');
    Route::post('stock-transfers/{stockTransfer}/reject', [StockTransferController::class, 'reject'])
        ->name('stock-transfers.reject');

    Route::get('inventory-adjustments', [InventoryAdjustmentController::class, 'index'])
        ->middleware('can:inventory-adjustments.view')
        ->name('inventory-adjustments.index');
    Route::post('inventory-adjustments', [InventoryAdjustmentController::class, 'store'])
        ->middleware('can:inventory-adjustments.create')
        ->name('inventory-adjustments.store');

    Route::get('stock-counts', [StockCountController::class, 'index'])
        ->middleware('can:stock-counts.view')
        ->name('stock-counts.index');
    Route::post('stock-counts', [StockCountController::class, 'store'])
        ->middleware('can:stock-counts.create')
        ->name('stock-counts.store');

    Route::get('warehouses', [WarehouseManagementController::class, 'index'])
        ->middleware('can:warehouses.view')
        ->name('warehouses.index');
    Route::post('warehouses', [WarehouseManagementController::class, 'store'])
        ->middleware('can:warehouses.create')
        ->name('warehouses.store');
    Route::put('warehouses/{warehouse}', [WarehouseManagementController::class, 'update'])
        ->middleware('can:warehouses.update')
        ->name('warehouses.update');
    Route::post('warehouse-locations', [WarehouseManagementController::class, 'storeLocation'])
        ->middleware('can:warehouses.update')
        ->name('warehouse-locations.store');
    Route::put('warehouse-locations/{warehouseLocation}', [WarehouseManagementController::class, 'updateLocation'])
        ->middleware('can:warehouses.update')
        ->name('warehouse-locations.update');
    Route::put('warehouse-locations/{warehouseLocation}/items', [WarehouseManagementController::class, 'assignItems'])
        ->middleware('can:warehouses.update')
        ->name('warehouse-locations.items.update');
    Route::put('warehouses/{warehouse}/permissions', [WarehouseManagementController::class, 'updatePermissions'])
        ->middleware('can:warehouses.permissions')
        ->name('warehouses.permissions.update');

    // Items
    Route::get('items', ItemIndexController::class)
        ->middleware('can:items.view')
        ->name('items.index');
    Route::get('items/create', ItemCreateController::class)
        ->middleware('can:items.create')
        ->name('items.create');
    Route::post('items', ItemStoreController::class)
        ->middleware('can:items.create')
        ->name('items.store');
    Route::get('items/{item}', ItemShowController::class)
        ->middleware('can:items.view')
        ->name('items.show');
    Route::get('items/{item}/edit', ItemEditController::class)
        ->middleware('can:items.update')
        ->name('items.edit');
    Route::put('items/{item}', ItemUpdateController::class)
        ->middleware('can:items.update')
        ->name('items.update');
    Route::delete('items/{item}', ItemDestroyController::class)
        ->middleware('can:items.delete')
        ->name('items.destroy');

    // Inventory categories
    Route::get('inventory-categories', InventoryCategoryIndexController::class)
        ->middleware('can:items.view')
        ->name('inventory-categories.index');
    Route::post('inventory-categories', InventoryCategoryStoreController::class)
        ->middleware('can:items.create')
        ->name('inventory-categories.store');
    Route::put('inventory-categories/{inventoryCategory}', InventoryCategoryUpdateController::class)
        ->middleware('can:items.update')
        ->name('inventory-categories.update');

    // Audit logs
    Route::get('audits', [AuditController::class, 'index'])
        ->middleware('can:audits.view')
        ->name('audits.index');

    Route::get('audits/{id}', [AuditController::class, 'show'])
        ->middleware('can:audits.view')
        ->whereNumber('id')
        ->name('audits.show');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::get('/notifications/latest', [NotificationController::class, 'latest'])
        ->name('notifications.latest');

    Route::post('/notifications/read-all', [NotificationController::class, 'readAll'])
        ->name('notifications.read-all');

    Route::post('/notifications/{id}/read', [NotificationController::class, 'read'])
        ->name('notifications.read');

    Route::post('/api/test-notification', [NotificationController::class, 'sendTestNotification'])
        ->name('notifications.test');
});

require __DIR__.'/settings.php';
