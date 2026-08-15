<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
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
        // * The one place the password policy is stated; every rule set defers to Password::defaults().
        // * Length only, no composition rules — NIST 800-63B treats mixed-case/digit/symbol requirements as
        // * counterproductive. The max is bcrypt's: it silently truncates past 72 bytes, so a longer password
        // * would be accepted and then half-ignored. 255 keeps the message honest without inviting that.
        // ! uncompromised() calls the Have I Been Pwned range API, so it runs in production only: tests would
        // ! make network calls and local development would break whenever the service is unreachable.
        Password::defaults(function () {
            $password = Password::min(8)->max(255);

            return $this->app->isProduction() ? $password->uncompromised() : $password;
        });

        // * Password reset links resolve to the Nuxt front-end, not the API.
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return config('app.frontend_url')."/password-reset/{$token}?email={$email}";
        });
    }
}
