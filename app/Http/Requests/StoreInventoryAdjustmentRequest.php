<?php

namespace App\Http\Requests;

use App\Models\InventoryAdjustment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('inventory-adjustments.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'adjustment_number' => ['nullable', 'string', 'max:80', Rule::unique('inventory_adjustments', 'adjustment_number')],
            'adjustment_type' => ['required', 'string', Rule::in(InventoryAdjustment::TYPES)],
            'reason' => ['required', 'string', Rule::in(InventoryAdjustment::REASONS)],
            'adjustment_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'lines.*.quantity_adjusted' => ['required', 'numeric', 'gt:0'],
            'lines.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'adjustment_type.required' => 'Select the adjustment type.',
            'adjustment_type.in' => 'Select a valid adjustment type.',
            'reason.required' => 'Select the adjustment reason.',
            'reason.in' => 'Select a valid adjustment reason.',
            'adjustment_date.required' => 'Enter the adjustment date.',
            'lines.required' => 'Add at least one item to adjust.',
            'lines.*.item_id.required' => 'Select an item for every adjustment line.',
            'lines.*.quantity_adjusted.gt' => 'The adjustment quantity must be greater than zero.',
        ];
    }
}
