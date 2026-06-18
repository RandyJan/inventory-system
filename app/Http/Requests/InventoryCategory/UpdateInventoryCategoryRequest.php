<?php

namespace App\Http\Requests\InventoryCategory;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $category = $this->route('inventoryCategory');

        return [
            'parent_id' => ['nullable', 'integer', 'exists:inventory_categories,id'],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_categories', 'name')
                    ->ignore($category)
                    ->where(fn ($query) => $query->where('parent_id', $this->input('parent_id'))),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The category name is required.',
            'name.unique' => 'A category with this name already exists at this level.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'parent_id' => $this->filled('parent_id') ? $this->integer('parent_id') : null,
        ]);
    }
}
