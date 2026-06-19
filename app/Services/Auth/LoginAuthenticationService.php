<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\FirstLoginBootstrapService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class LoginAuthenticationService
{
    public function __construct(
        private FirstLoginBootstrapService $firstLoginBootstrapService,
    ) {}

    public function authenticate(string $username, string $password, string $usernameField): ?User
    {
        $authenticatedUser = $this->attemptLdapAuthentication($username, $password, $usernameField)
            ?? $this->attemptDatabaseAuthentication($username, $password);

        if ($authenticatedUser === null) {
            return null;
        }

        $authenticatedUser = $this->firstLoginBootstrapService->bootstrap($authenticatedUser);

        if (! $authenticatedUser->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                $usernameField => 'Your account has been deactivated.',
            ]);
        }

        return $authenticatedUser;
    }

    private function attemptLdapAuthentication(string $username, string $password, string $usernameField): ?User
    {
        try {
            if (! Auth::attempt([
                $usernameField => $username,
                'password' => $password,
            ])) {
                return null;
            }
        } catch (Throwable $exception) {
            Log::warning('LDAP authentication attempt failed; falling back to database authentication.', [
                'username' => $username,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }

        $authenticatedUser = Auth::user();

        if (! $authenticatedUser instanceof User) {
            Auth::logout();

            return null;
        }

        return $authenticatedUser;
    }

    private function attemptDatabaseAuthentication(string $username, string $password): ?User
    {
        $databaseUser = User::query()
            ->where('username', $username)
            ->orWhere('email', $username)
            ->first();

        if ($databaseUser === null || ! Hash::check($password, $databaseUser->getAuthPassword())) {
            return null;
        }

        return $databaseUser;
    }
}
