<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignItemsToWarehouseLocationRequest;
use App\Http\Requests\StoreWarehouseLocationRequest;
use App\Http\Requests\StoreWarehouseRequest;
use App\Http\Requests\UpdateWarehouseLocationRequest;
use App\Http\Requests\UpdateWarehousePermissionsRequest;
use App\Http\Requests\UpdateWarehouseRequest;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\WarehouseManagementService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseManagementController extends Controller
{
    public function __construct(private readonly WarehouseManagementService $service) {}

    public function index(): Response
    {
        return Inertia::render('warehouses/index', [
            'warehouses' => $this->service->warehouses(),
            'summary' => $this->service->summary(),
            'users' => $this->service->users(),
            'items' => $this->service->assignableItems(),
            'warehouseTypes' => Warehouse::TYPES,
            'locationTypes' => WarehouseLocation::TYPES,
        ]);
    }

    public function store(StoreWarehouseRequest $request): RedirectResponse
    {
        $this->service->createWarehouse($request->validated());

        return back()->with('success', 'Warehouse created.');
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $this->service->updateWarehouse($warehouse, $request->validated());

        return back()->with('success', 'Warehouse updated.');
    }

    public function storeLocation(StoreWarehouseLocationRequest $request): RedirectResponse
    {
        $this->service->createLocation($request->validated());

        return back()->with('success', 'Location created.');
    }

    public function updateLocation(UpdateWarehouseLocationRequest $request, WarehouseLocation $warehouseLocation): RedirectResponse
    {
        $this->service->updateLocation($warehouseLocation, $request->validated());

        return back()->with('success', 'Location updated.');
    }

    public function assignItems(AssignItemsToWarehouseLocationRequest $request, WarehouseLocation $warehouseLocation): RedirectResponse
    {
        $this->service->assignItemsToLocation($warehouseLocation, $request->validated('item_ids') ?? []);

        return back()->with('success', 'Location inventory updated.');
    }

    public function updatePermissions(UpdateWarehousePermissionsRequest $request, Warehouse $warehouse): RedirectResponse
    {
        $this->service->syncPermissions($warehouse, $request->validated('permissions') ?? []);

        return back()->with('success', 'Warehouse permissions updated.');
    }
}
