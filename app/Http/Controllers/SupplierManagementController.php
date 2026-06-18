<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Services\SupplierManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierManagementController extends Controller
{
    public function __construct(private readonly SupplierManagementService $service) {}

    public function index(Request $request): Response
    {
        return Inertia::render('suppliers/index', [
            'suppliers' => $this->service->suppliers($request->only(['search', 'status', 'per_page'])),
            'summary' => $this->service->summary(),
            'statuses' => $this->service->statuses(),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status', 'all')->toString(),
                'per_page' => $request->integer('per_page', 15),
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return back()->with('success', 'Supplier registered.');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $this->service->update($supplier, $request->validated());

        return back()->with('success', 'Supplier updated.');
    }
}
