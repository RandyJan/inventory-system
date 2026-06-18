<?php

namespace App\Http\Requests;

use App\Models\Warehouse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('warehouses.update') ?? false;
    }

    public function rules(): array
    {
        $warehouse = $this->route('warehouse');
        $warehouseId = $warehouse instanceof Warehouse ? $warehouse->getKey() : $warehouse;

        return [
            'warehouse_code' => ['required', 'string', 'max:50', Rule::unique('warehouses', 'warehouse_code')->ignore($warehouseId)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(Warehouse::TYPES)],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'campus' => ['nullable', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'capacity' => ['required', 'numeric', 'min:0'],
            'used_capacity' => ['required', 'numeric', 'min:0', 'lte:capacity'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'manager_id' => $this->input('manager_id') === 'none' ? null : $this->input('manager_id'),
        ]);
    }
}
