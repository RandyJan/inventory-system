<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWarehousePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('warehouses.permissions') ?? false;
    }

    public function rules(): array
    {
        return [
            'permissions' => ['nullable', 'array'],
            'permissions.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'permissions.*.can_view' => ['nullable', 'boolean'],
            'permissions.*.can_receive' => ['nullable', 'boolean'],
            'permissions.*.can_transfer' => ['nullable', 'boolean'],
            'permissions.*.can_adjust' => ['nullable', 'boolean'],
        ];
    }
}
