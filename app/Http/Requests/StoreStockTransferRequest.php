<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('stock-transfers.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'transfer_number' => ['nullable', 'string', 'max:80', Rule::unique('stock_transfers', 'transfer_number')],
            'source_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'destination_warehouse_id' => ['required', 'integer', 'different:source_warehouse_id', 'exists:warehouses,id'],
            'destination_location_id' => [
                'nullable',
                'integer',
                Rule::exists('warehouse_locations', 'id')
                    ->where('warehouse_id', $this->integer('destination_warehouse_id')),
            ],
            'requested_date' => ['required', 'date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,id'],
            'lines.*.quantity_transferred' => ['required', 'numeric', 'gt:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'source_warehouse_id.required' => 'Select the source warehouse.',
            'destination_warehouse_id.required' => 'Select the destination warehouse.',
            'destination_warehouse_id.different' => 'The destination warehouse must be different from the source warehouse.',
            'requested_date.required' => 'Enter the transfer request date.',
            'lines.required' => 'Add at least one item to transfer.',
            'lines.*.item_id.required' => 'Select an item for every transfer line.',
            'lines.*.quantity_transferred.gt' => 'The transfer quantity must be greater than zero.',
        ];
    }
}
