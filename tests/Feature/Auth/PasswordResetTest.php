<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('a reset link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email])
        ->assertOk();

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('a reset link request for an unknown email reports the email field', function () {
    Notification::fake();

    $this->postJson('/forgot-password', ['email' => 'nobody@example.com'])
        ->assertJsonValidationErrors('email');

    Notification::assertNothingSent();
});

test('an immediate second reset link request is throttled', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email])->assertOk();

    $this->postJson('/forgot-password', ['email' => $user->email])
        ->assertJsonValidationErrors('email');

    Notification::assertSentToTimes($user, ResetPasswordNotification::class, 1);
});

test('the reset link resolves to the front-end reset page', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $email = urlencode($user->email);

        expect($notification->toMail($user)->actionUrl)
            ->toBe(config('app.frontend_url')."/password-reset/{$notification->token}?email={$email}");

        return true;
    });
});

test('the password can be reset with a valid token', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $this->postJson('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        return true;
    });
});

test('the password cannot be reset with an invalid token', function () {
    $user = User::factory()->create();

    $this->postJson('/reset-password', [
        'token' => 'invalid-token',
        'email' => $user->email,
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertJsonValidationErrors('email');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a reset fails when the confirmation does not match', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $this->postJson('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ])->assertJsonValidationErrors('password');

        return true;
    });

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});
