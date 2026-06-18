<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvertPurchaseRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchase-requisitions.convert') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'purchase_order_reference' => ['nullable', 'string', 'max:120'],
            'approval_remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
