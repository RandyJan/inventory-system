<?php

namespace App\Http\Requests;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('suppliers.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $supplier = $this->route('supplier');
        $supplierId = $supplier instanceof Supplier ? $supplier->getKey() : $supplier;

        return [
            'supplier_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('suppliers', 'supplier_code')->ignore($supplierId),
            ],
            'company_name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'email_address' => ['nullable', 'email', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:2000'],
            'tax_identification_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('suppliers', 'tax_identification_number')->ignore($supplierId),
            ],
            'status' => ['required', 'string', Rule::in(Supplier::STATUSES)],
            'total_orders' => ['required', 'integer', 'min:0'],
            'fulfilled_orders' => ['required', 'integer', 'min:0', 'lte:total_orders'],
            'late_deliveries' => ['required', 'integer', 'min:0', 'lte:fulfilled_orders'],
            'performance_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'last_delivery_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'supplier_code.required' => 'The supplier code is required.',
            'supplier_code.unique' => 'This supplier code already exists.',
            'company_name.required' => 'The company name is required.',
            'tax_identification_number.unique' => 'This tax identification number already exists.',
            'fulfilled_orders.lte' => 'Fulfilled orders cannot exceed total orders.',
            'late_deliveries.lte' => 'Late deliveries cannot exceed fulfilled orders.',
        ];
    }
}
