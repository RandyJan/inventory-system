<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    private ?string $secretKey;

    private string $verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct()
    {
        $this->secretKey = config('captcha.secret_key');
    }

    /**
     * Validate Turnstile token with Cloudflare API.
     */
    public function validate(string $token, ?string $remoteIp = null): bool
    {
        if (! config('captcha.enabled')) {
            return true;
        }

        if (empty($this->secretKey)) {
            Log::error('Turnstile secret key is not configured');

            return false;
        }

        try {
            $response = Http::asJson()->post($this->verifyUrl, [
                'secret' => $this->secretKey,
                'response' => $token,
                'remoteip' => $remoteIp,
            ]);

            if (! $response->successful()) {
                Log::error('Turnstile API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            $result = $response->json();

            if (! isset($result['success'])) {
                Log::error('Turnstile API returned invalid response', [
                    'response' => $result,
                ]);

                return false;
            }

            if (! $result['success']) {
                Log::warning('Turnstile validation failed', [
                    'error_codes' => $result['error-codes'] ?? [],
                ]);

                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Turnstile validation exception', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
