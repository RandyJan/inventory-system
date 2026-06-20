<?php

namespace App\Services;

use App\Models\ApprovalStep;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ApprovalWorkflowService
{
    /**
     * @return Collection<int, ApprovalWorkflow>
     */
    public function workflows(): Collection
    {
        return ApprovalWorkflow::query()
            ->with('steps')
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array{name: string, workflow_type: string, description?: string|null, is_active?: bool, steps: list<array{name: string, role_name?: string|null, permission_name: string}>}  $data
     */
    public function create(array $data): ApprovalWorkflow
    {
        $workflow = ApprovalWorkflow::create([
            'name' => $data['name'],
            'workflow_type' => $data['workflow_type'],
            'description' => $data['description'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        $this->syncSteps($workflow, $data['steps']);

        return $workflow->load('steps');
    }

    /**
     * @param  array{name: string, workflow_type: string, description?: string|null, is_active?: bool, steps: list<array{name: string, role_name?: string|null, permission_name: string}>}  $data
     */
    public function update(ApprovalWorkflow $workflow, array $data): ApprovalWorkflow
    {
        $workflow->forceFill([
            'name' => $data['name'],
            'workflow_type' => $data['workflow_type'],
            'description' => $data['description'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ])->save();

        $this->syncSteps($workflow, $data['steps']);

        return $workflow->load('steps');
    }

    public function start(Model $approvable, string $workflowType): void
    {
        $workflow = $this->activeWorkflow($workflowType);

        if (! $workflow || ! method_exists($approvable, 'approvalSteps')) {
            return;
        }

        if ($approvable->approvalSteps()->exists()) {
            return;
        }

        $workflow->steps->each(function (ApprovalWorkflowStep $step) use ($approvable, $workflow): void {
            ApprovalStep::create([
                'approvable_type' => $approvable->getMorphClass(),
                'approvable_id' => $approvable->getKey(),
                'approval_workflow_id' => $workflow->id,
                'approval_workflow_step_id' => $step->id,
                'level' => $step->level,
                'name' => $step->name,
                'role_name' => $step->role_name,
                'permission_name' => $step->permission_name,
            ]);
        });
    }

    public function currentStep(Model $approvable): ?ApprovalStep
    {
        if (! method_exists($approvable, 'approvalSteps')) {
            return null;
        }

        return $approvable->approvalSteps()
            ->where('status', ApprovalStep::STATUS_PENDING)
            ->orderBy('level')
            ->first();
    }

    /**
     * @return array{step: ApprovalStep|null, completed: bool}
     */
    public function approveCurrentStep(Model $approvable, User $actor, ?string $remarks): array
    {
        $step = $this->currentStep($approvable);

        if (! $step) {
            return ['step' => null, 'completed' => true];
        }

        $this->ensureCanAct($actor, $step);

        $step->forceFill([
            'status' => ApprovalStep::STATUS_APPROVED,
            'acted_by' => $actor->id,
            'acted_at' => now(),
            'remarks' => $remarks,
        ])->save();

        return [
            'step' => $step,
            'completed' => $this->currentStep($approvable->refresh()) === null,
        ];
    }

    public function rejectCurrentStep(Model $approvable, User $actor, string $remarks): ApprovalStep
    {
        $step = $this->currentStep($approvable);

        if (! $step) {
            throw ValidationException::withMessages([
                'approval' => 'This request no longer has a pending approval step.',
            ]);
        }

        $this->ensureCanAct($actor, $step);

        $step->forceFill([
            'status' => ApprovalStep::STATUS_REJECTED,
            'acted_by' => $actor->id,
            'acted_at' => now(),
            'remarks' => $remarks,
        ])->save();

        return $step;
    }

    public function activeWorkflow(string $workflowType): ?ApprovalWorkflow
    {
        return ApprovalWorkflow::query()
            ->with('steps')
            ->where('workflow_type', $workflowType)
            ->where('is_active', true)
            ->first();
    }

    private function ensureCanAct(User $actor, ApprovalStep $step): void
    {
        if ($actor->can($step->permission_name) || $actor->can('approval-workflows.manage')) {
            return;
        }

        throw ValidationException::withMessages([
            'approval' => "You cannot approve the {$step->name} level.",
        ]);
    }

    /**
     * @param  list<array{name: string, role_name?: string|null, permission_name: string}>  $steps
     */
    private function syncSteps(ApprovalWorkflow $workflow, array $steps): void
    {
        $workflow->steps()->delete();

        collect($steps)
            ->values()
            ->each(function (array $step, int $index) use ($workflow): void {
                $workflow->steps()->create([
                    'level' => $index + 1,
                    'name' => $step['name'],
                    'role_name' => $step['role_name'] ?? null,
                    'permission_name' => $step['permission_name'],
                ]);
            });
    }
}
