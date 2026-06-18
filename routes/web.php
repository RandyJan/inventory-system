<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\InventoryCategory\IndexController as InventoryCategoryIndexController;
use App\Http\Controllers\InventoryCategory\StoreController as InventoryCategoryStoreController;
use App\Http\Controllers\InventoryCategory\UpdateController as InventoryCategoryUpdateController;
use App\Http\Controllers\Item\CreateController as ItemCreateController;
use App\Http\Controllers\Item\DestroyController as ItemDestroyController;
use App\Http\Controllers\Item\EditController as ItemEditController;
use App\Http\Controllers\Item\IndexController as ItemIndexController;
use App\Http\Controllers\Item\ShowController as ItemShowController;
use App\Http\Controllers\Item\StoreController as ItemStoreController;
use App\Http\Controllers\Item\UpdateController as ItemUpdateController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PermissionManagementController;
use App\Http\Controllers\RoleManagementController;
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
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->middleware('can:dashboard.view')->name('dashboard');

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

    Route::get('suppliers', [SupplierManagementController::class, 'index'])
        ->middleware('can:suppliers.view')
        ->name('suppliers.index');
    Route::post('suppliers', [SupplierManagementController::class, 'store'])
        ->middleware('can:suppliers.create')
        ->name('suppliers.store');
    Route::put('suppliers/{supplier}', [SupplierManagementController::class, 'update'])
        ->middleware('can:suppliers.update')
        ->name('suppliers.update');

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
