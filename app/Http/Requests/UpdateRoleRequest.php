<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('roles.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $role = $this->route('role');
        $roleId = $role instanceof Role ? $role->getKey() : $role;

        return [
            'name' => [
                'required',
                'string',
                'max:125',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'web')
                    ->ignore($roleId),
            ],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::exists('permissions', 'name')->where('guard_name', 'web'),
            ],
            'new_permissions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get the "after" validation callables for the request.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ($this->newPermissionNames() as $permissionName) {
                    if (mb_strlen($permissionName) > 125) {
                        $validator->errors()->add(
                            'new_permissions',
                            'Each new permission name may not be greater than 125 characters.'
                        );

                        return;
                    }
                }
            },
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
            'name.required' => 'The role name is required.',
            'name.unique' => 'A role with this name already exists.',
            'permissions.array' => 'The selected permissions are invalid.',
            'permissions.*.exists' => 'One of the selected permissions does not exist.',
            'new_permissions.max' => 'The new permissions list may not be greater than 2000 characters.',
        ];
    }

    /**
     * @return list<string>
     */
    private function newPermissionNames(): array
    {
        $permissionNames = preg_split('/[\r\n,]+/', (string) $this->input('new_permissions'), -1, PREG_SPLIT_NO_EMPTY);

        if ($permissionNames === false) {
            return [];
        }

        return collect($permissionNames)
            ->map(fn (string $permissionName): string => trim($permissionName))
            ->filter()
            ->values()
            ->all();
    }
}
