<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockReceivingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('stock-receivings.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'receiving_number' => ['nullable', 'string', 'max:80', Rule::unique('stock_receivings', 'receiving_number')],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'delivery_date' => ['required', 'date'],
            'purchase_order_reference' => ['nullable', 'string', 'max:120'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'lines.*.quantity_received' => ['required', 'numeric', 'gt:0'],
            'lines.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Select the supplier that delivered the items.',
            'delivery_date.required' => 'Enter the delivery date.',
            'lines.required' => 'Add at least one received item.',
            'lines.*.item_id.required' => 'Select an item for every receiving line.',
            'lines.*.quantity_received.gt' => 'The received quantity must be greater than zero.',
        ];
    }
}
