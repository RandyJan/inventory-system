<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApprovalWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('approval-workflows.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $workflowId = $this->route('approvalWorkflow')?->id;

        return [
            'name' => ['required', 'string', 'max:150'],
            'workflow_type' => [
                'required',
                'string',
                'max:100',
                Rule::unique('approval_workflows', 'workflow_type')->ignore($workflowId),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.name' => ['required', 'string', 'max:120'],
            'steps.*.role_name' => ['nullable', 'string', 'max:120'],
            'steps.*.permission_name' => ['required', 'string', 'max:150'],
        ];
    }
}
