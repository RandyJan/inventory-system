<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockIssuanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('stock-issuances.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'issue_number' => ['nullable', 'string', 'max:80', Rule::unique('stock_issuances', 'issue_number')],
            'requesting_department' => ['required', 'string', 'max:120'],
            'requestor' => ['required', 'string', 'max:120'],
            'date_issued' => ['required', 'date'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'lines.*.quantity_issued' => ['required', 'numeric', 'gt:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requesting_department.required' => 'Enter the department requesting the items.',
            'requestor.required' => 'Enter the requestor name.',
            'date_issued.required' => 'Enter the issue date.',
            'lines.required' => 'Add at least one item to issue.',
            'lines.*.item_id.required' => 'Select an item for every issuance line.',
            'lines.*.quantity_issued.gt' => 'The issued quantity must be greater than zero.',
        ];
    }
}
