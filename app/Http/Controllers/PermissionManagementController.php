<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeletePermissionRequest;
use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Services\PermissionManagementService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionManagementController extends Controller
{
    public function __construct(private readonly PermissionManagementService $service) {}

    public function index(): Response
    {
        return Inertia::render('permissions/index', [
            'permissions' => $this->service->permissions(),
        ]);
    }

    public function store(StorePermissionRequest $request): RedirectResponse
    {
        $this->service->create($request->validated(), $request->user());

        return back()->with('success', 'Permission created.');
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $this->service->update($permission, $request->validated(), $request->user());

        return back()->with('success', 'Permission updated.');
    }

    public function destroy(DeletePermissionRequest $request, Permission $permission): RedirectResponse
    {
        $this->service->delete($permission, $request->user());

        return back()->with('success', 'Permission deleted.');
    }
}
