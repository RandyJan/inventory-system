<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRoleRequest;
use App\Http\Requests\UpdateUserStatusRequest;
use App\Http\Requests\UserManagementIndexRequest;
use App\Models\User;
use App\Services\UserManagementService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function __construct(private readonly UserManagementService $service) {}

    public function index(UserManagementIndexRequest $request): Response
    {
        $perPage = (int) $request->input('per_page', 15);
        $filters = $request->safe()->only(['search', 'status']);

        return Inertia::render('users/index', [
            'users' => $this->service->list($filters, $perPage),
            'roles' => $this->service->roles(),
            'filters' => $filters,
        ]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $this->service->updateRole(
            $user,
            $request->validated('role'),
            $request->user()
        );

         return redirect()->route('users.index')->with('success', 'User role updated.');
    }

    public function activate(UpdateUserStatusRequest $request, User $user): RedirectResponse
    {
        $this->service->activate($user, $request->user());

       return redirect()->route('users.index')->with('success', 'User activated.');
    }

    public function deactivate(UpdateUserStatusRequest $request, User $user): RedirectResponse
    {
        $this->service->deactivate($user, $request->user());

        return redirect()->route('users.index')->with('success', 'User deactivated.');
    }
}
