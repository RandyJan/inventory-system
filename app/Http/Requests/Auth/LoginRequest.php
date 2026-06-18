<?php

namespace App\Http\Requests\Auth;

use App\Services\TurnstileService;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            config('fortify.username') => ['required', 'string'],
            'password' => ['required', 'string'],
            'cf-turnstile-response' => ['required', 'string'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $turnstileToken = $this->input('cf-turnstile-response');

            if ($turnstileToken) {
                $turnstileService = app(TurnstileService::class);
                $isValid = $turnstileService->validate($turnstileToken, $this->ip());

                if (! $isValid) {
                    $validator->errors()->add(
                        'cf-turnstile-response',
                        'CAPTCHA verification failed. Please try again.'
                    );
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'cf-turnstile-response.required' => 'Please complete the CAPTCHA verification.',
        ];
    }
}
