<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchase-requisitions.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'requisition_number' => ['nullable', 'string', 'max:80', Rule::unique('purchase_requisitions', 'requisition_number')],
            'requesting_department' => ['required', 'string', 'max:120'],
            'purpose' => ['required', 'string', 'max:255'],
            'needed_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'submit' => ['required', 'boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['nullable', 'integer', 'exists:items,id'],
            'lines.*.item_description' => ['required', 'string', 'max:255'],
            'lines.*.quantity_requested' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_of_measure' => ['required', 'string', 'max:40'],
            'lines.*.estimated_unit_cost' => ['required', 'numeric', 'gte:0'],
            'lines.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requesting_department.required' => 'Enter the requesting department.',
            'purpose.required' => 'Enter the purpose of this purchase request.',
            'lines.required' => 'Add at least one requested item.',
            'lines.*.item_description.required' => 'Enter an item description for every line.',
            'lines.*.quantity_requested.gt' => 'The requested quantity must be greater than zero.',
            'lines.*.unit_of_measure.required' => 'Enter the unit of measure for every line.',
        ];
    }
}
