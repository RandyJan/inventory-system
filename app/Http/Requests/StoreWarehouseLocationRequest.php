<?php

namespace App\Http\Requests;

use App\Models\WarehouseLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseLocationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->input('name') ?: $this->input('location_code'),
            'type' => $this->input('type') ?: 'stockroom',
        ]);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('warehouses.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'parent_id' => ['nullable', 'integer', 'exists:warehouse_locations,id'],
            'location_code' => ['required', 'string', 'max:80'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(WarehouseLocation::TYPES)],
            'building' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'string', 'max:255'],
            'room' => ['nullable', 'string', 'max:255'],
            'rack' => ['nullable', 'string', 'max:255'],
            'shelf' => ['nullable', 'string', 'max:255'],
            'bin' => ['nullable', 'string', 'max:255'],
            'capacity' => ['required', 'numeric', 'min:0'],
            'used_capacity' => ['required', 'numeric', 'min:0', 'lte:capacity'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
