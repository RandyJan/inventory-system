<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteRoleRequest;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Services\RoleManagementService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    public function __construct(private readonly RoleManagementService $service) {}

    public function index(): Response
    {
        return Inertia::render('roles/index', [
            'roles' => $this->service->roles(),
            'permissions' => $this->service->permissions(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $this->service->create($request->validated(), $request->user());

        return back()->with('success', 'Role created.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->service->update($role, $request->validated(), $request->user());

        return back()->with('success', 'Role updated.');
    }

    public function destroy(DeleteRoleRequest $request, Role $role): RedirectResponse
    {
        $this->service->delete($role, $request->user());

        return back()->with('success', 'Role deleted.');
    }
}
