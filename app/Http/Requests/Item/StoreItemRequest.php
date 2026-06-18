<?php

namespace App\Http\Requests\Item;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'item_code' => ['required', 'string', 'unique:items,item_code', 'max:50'],
            'barcode' => ['nullable', 'string', 'unique:items,barcode', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required_without:category_id', 'nullable', 'string', 'max:100'],
            'subcategory' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:inventory_categories,id'],
            'subcategory_id' => ['nullable', 'integer', 'exists:inventory_categories,id'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'brand' => ['nullable', 'string', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:100'],
            'reorder_level' => ['required', 'numeric', 'min:0'],
            'maximum_stock_level' => ['required', 'numeric', 'min:0'],
            'minimum_stock_level' => ['required', 'numeric', 'min:0'],
            'standard_cost' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'item_code.unique' => 'This item code already exists.',
            'barcode.unique' => 'This barcode already exists.',
            'item_code.required' => 'The item code is required.',
            'name.required' => 'The item name is required.',
            'category.required' => 'The category is required.',
            'category.required_without' => 'The category is required.',
            'unit_of_measure.required' => 'The unit of measure is required.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'category_id' => $this->filled('category_id') ? $this->integer('category_id') : null,
            'subcategory_id' => $this->filled('subcategory_id') ? $this->integer('subcategory_id') : null,
        ]);
    }
}
