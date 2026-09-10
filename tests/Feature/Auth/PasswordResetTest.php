<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('a reset link can be requested', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonStructure(['status']);

    Notification::assertSentTo($user, ResetPasswordNotification::class);
});

test('a reset link request requires an email', function () {
    $this->postJson('/forgot-password', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

// * 264 characters and structurally valid, so only max:255 can reject it — the same bound the
// * register and user-management endpoints already enforced.
test('a reset link request rejects an overlong email', function () {
    $this->postJson('/forgot-password', [
        'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

test('a reset rejects an overlong email', function () {
    $this->postJson('/reset-password', [
        'token' => 'some-token',
        'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

test('a reset requires a token, an email, and a password', function () {
    $this->postJson('/reset-password', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['token', 'email', 'password']);
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

// * This branch's reset page reads the token from the query string; master's reads it from the path segment.
test('the reset link points at the front-end route with token and email in the query string', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $email = urlencode($user->email);

        expect($notification->toMail($user)->actionUrl)
            ->toBe(config('app.frontend_url')."/password-reset?token={$notification->token}&email={$email}");

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
        ])->assertOk()->assertJsonStructure(['status']);

        return true;
    });

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
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

test('a reset rejects a password below the minimum length', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $this->postJson('/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'shortpw',
            'password_confirmation' => 'shortpw',
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        return true;
    });

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
