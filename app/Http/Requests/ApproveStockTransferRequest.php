<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('stock-transfers.approve') ||
            $user?->can('stock-transfers.approve.supervisor') ||
            $user?->can('stock-transfers.approve.department-head') ||
            $user?->can('stock-transfers.approve.inventory-manager') ||
            $user?->can('approval-workflows.manage') ||
            false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'approval_remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
