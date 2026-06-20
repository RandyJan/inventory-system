<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApprovalWorkflowRequest;
use App\Http\Requests\UpdateApprovalWorkflowRequest;
use App\Models\ApprovalWorkflow;
use App\Services\ApprovalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalWorkflowController extends Controller
{
    public function __construct(private readonly ApprovalWorkflowService $service) {}

    public function index(): Response
    {
        return Inertia::render('approval-workflows/index', [
            'workflows' => $this->service->workflows()->map(fn (ApprovalWorkflow $workflow): array => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'workflow_type' => $workflow->workflow_type,
                'description' => $workflow->description,
                'is_active' => $workflow->is_active,
                'steps' => $workflow->steps->map(fn ($step): array => [
                    'id' => $step->id,
                    'level' => $step->level,
                    'name' => $step->name,
                    'role_name' => $step->role_name,
                    'permission_name' => $step->permission_name,
                ])->values(),
            ])->values(),
            'workflowTypes' => [
                [
                    'value' => ApprovalWorkflow::TYPE_STOCK_TRANSFER,
                    'label' => 'Stock Transfer',
                ],
            ],
        ]);
    }

    public function store(StoreApprovalWorkflowRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());

        return back()->with('success', 'Approval workflow created.');
    }

    public function update(UpdateApprovalWorkflowRequest $request, ApprovalWorkflow $approvalWorkflow): RedirectResponse
    {
        $this->service->update($approvalWorkflow, $request->validated());

        return back()->with('success', 'Approval workflow updated.');
    }
}
