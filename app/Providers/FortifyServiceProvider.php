<?php

namespace App\Providers;

use App\Services\Auth\LoginAuthenticationService;
use App\Services\TurnstileService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        // Custom authentication callback for LDAP with database password fallback
        Fortify::authenticateUsing(function (Request $request) {
            $usernameField = config('fortify.username');
            $captchaEnabled = (bool) config('captcha.enabled');

            // Validate turnstile token
            $request->validate([
                $usernameField => ['required', 'string'],
                'password' => ['required', 'string'],
                'cf-turnstile-response' => [$captchaEnabled ? 'required' : 'nullable', 'string'],
            ], [
                'cf-turnstile-response.required' => 'Please complete the CAPTCHA verification.',
            ]);

            if ($captchaEnabled) {
                $turnstileToken = $request->input('cf-turnstile-response');
                $turnstileService = app(TurnstileService::class);

                if (! $turnstileService->validate((string) $turnstileToken, $request->ip())) {
                    throw ValidationException::withMessages([
                        'cf-turnstile-response' => 'CAPTCHA verification failed. Please try again.',
                    ]);
                }
            }

            return app(LoginAuthenticationService::class)->authenticate(
                username: (string) $request->input($usernameField),
                password: (string) $request->input('password'),
                usernameField: $usernameField,
            );
        });

        // Password confirmation should use the stored database hash, even for LDAP-synced users.
        Fortify::confirmPasswordsUsing(function ($user, string $password) {
            return Hash::check($password, $user->getAuthPassword());
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => false, // Disabled for LDAP authentication
            'canRegister' => false, // Disabled for LDAP authentication
            'status' => $request->session()->get('status'),
            'captchaEnabled' => config('captcha.enabled'),
            'turnstileSiteKey' => config('captcha.site_key'),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
