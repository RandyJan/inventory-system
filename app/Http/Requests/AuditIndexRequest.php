<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AuditIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('audits.view') ?? false;
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
            'search' => ['nullable', 'string', 'max:255'],
            'causer_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => [
                'nullable',
                Rule::in([
                    'login',
                    'logout',
                    'authentication',
                    'user-management',
                    'role-management',
                    'permission-management',
                    'inventory-tracking',
                ]),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'per_page.max' => 'The audit list can show at most 200 records per page.',
            'search.max' => 'The search term may not be greater than 255 characters.',
            'causer_id.exists' => 'The selected causer does not exist.',
            'type.in' => 'The selected activity type is invalid.',
        ];
    }
}
