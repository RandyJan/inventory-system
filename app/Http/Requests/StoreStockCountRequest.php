<?php

namespace App\Http\Requests;

use App\Models\StockCount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockCountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('stock-counts.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'count_number' => ['nullable', 'string', 'max:80', Rule::unique('stock_counts', 'count_number')],
            'count_type' => ['required', 'string', Rule::in(StockCount::TYPES)],
            'count_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'lines.*.actual_quantity' => ['required', 'numeric', 'min:0'],
            'lines.*.remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'count_type.required' => 'Select the stock count type.',
            'count_type.in' => 'Select a valid stock count type.',
            'count_date.required' => 'Enter the stock count date.',
            'lines.required' => 'Add at least one item to count.',
            'lines.*.item_id.required' => 'Select an item for every count line.',
            'lines.*.actual_quantity.required' => 'Enter the actual quantity for every count line.',
            'lines.*.actual_quantity.min' => 'Actual quantity cannot be negative.',
        ];
    }
}
