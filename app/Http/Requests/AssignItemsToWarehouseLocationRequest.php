<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignItemsToWarehouseLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('warehouses.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'item_ids' => ['nullable', 'array'],
            'item_ids.*' => ['integer', 'distinct', 'exists:items,id'],
        ];
    }
}
