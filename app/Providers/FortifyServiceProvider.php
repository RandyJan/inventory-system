<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Services\FirstLoginBootstrapService;
use App\Services\TurnstileService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        // Registration and password reset disabled for LDAP authentication
        // Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        // Fortify::createUsersUsing(CreateNewUser::class);

        // Custom authentication callback for LDAP
        Fortify::authenticateUsing(function (Request $request) {
            // Validate turnstile token
            $request->validate([
                config('fortify.username') => ['required', 'string'],
                'password' => ['required', 'string'],
                'cf-turnstile-response' => ['required', 'string'],
            ], [
                'cf-turnstile-response.required' => 'Please complete the CAPTCHA verification.',
            ]);

            $turnstileToken = $request->input('cf-turnstile-response');
            $turnstileService = app(TurnstileService::class);

            if (! $turnstileService->validate($turnstileToken, $request->ip())) {
                throw ValidationException::withMessages([
                    'cf-turnstile-response' => 'CAPTCHA verification failed. Please try again.',
                ]);
            }

            $credentials = [
                config('fortify.username') => $request->input(config('fortify.username')),
                'password' => $request->input('password'),
            ];

            if (Auth::attempt($credentials)) {
                $authenticatedUser = Auth::user();

                if ($authenticatedUser === null) {
                    return null;
                }

                $authenticatedUser = app(FirstLoginBootstrapService::class)->bootstrap($authenticatedUser);

                if (! $authenticatedUser->is_active) {
                    Auth::logout();

                    throw ValidationException::withMessages([
                        config('fortify.username') => 'Your account has been deactivated.',
                    ]);
                }

                return $authenticatedUser;
            }

            return null;
        });

        // Custom password confirmation callback for LDAP
        // This is critical: password confirmation should check against the synced database hash,
        // NOT attempt to re-authenticate via LDAP
        Fortify::confirmPasswordsUsing(function ($user, string $password) {
            // Check the password against the database hash directly
            // This uses the synced password from LDAP (sync_passwords => true)
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
