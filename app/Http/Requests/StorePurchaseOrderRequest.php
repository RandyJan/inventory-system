<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchase-orders.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'po_number' => ['nullable', 'string', 'max:80', Rule::unique('purchase_orders', 'po_number')],
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')->where('status', 'active')],
            'purchase_requisition_id' => ['nullable', 'integer', Rule::exists('purchase_requisitions', 'id')->where('status', 'approved')],
            'order_date' => ['required', 'date'],
            'expected_delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'submit' => ['required', 'boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['nullable', 'integer', 'exists:items,id'],
            'lines.*.item_description' => ['required', 'string', 'max:255'],
            'lines.*.quantity_ordered' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_of_measure' => ['required', 'string', 'max:40'],
            'lines.*.unit_cost' => ['required', 'numeric', 'gte:0'],
            'lines.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Select the supplier for this purchase order.',
            'supplier_id.exists' => 'Select an active supplier.',
            'order_date.required' => 'Enter the order date.',
            'expected_delivery_date.after_or_equal' => 'The expected delivery date must be on or after the order date.',
            'lines.required' => 'Add at least one purchase order item.',
            'lines.*.item_description.required' => 'Enter an item description for every line.',
            'lines.*.quantity_ordered.gt' => 'The ordered quantity must be greater than zero.',
            'lines.*.unit_of_measure.required' => 'Enter the unit of measure for every line.',
        ];
    }
}
