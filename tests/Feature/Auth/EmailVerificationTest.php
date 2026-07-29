<?php

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

test('registration sends an email verification notification', function () {
    Notification::fake();

    $this->postJson('/register', [
        'name' => 'Verify Me',
        'email' => 'verify@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNoContent();

    $user = User::where('email', 'verify@example.com')->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeFalse();
    Notification::assertSentTo($user, VerifyEmail::class);
});

test('email is verified via the signed url and redirects to the front-end', function () {
    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)]
    );

    $this->actingAs($user)
        ->get($verificationUrl)
        ->assertRedirect(config('app.frontend_url').'/profile?verified=1');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('a verification link with an invalid hash does not verify', function () {
    $user = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1('wrong-email')]
    );

    $this->actingAs($user)->get($verificationUrl)->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

test('a verification email can be resent', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->postJson('/email/verification-notification')
        ->assertOk()
        ->assertJsonPath('status', 'verification-link-sent');

    Notification::assertSentTo($user, VerifyEmail::class);
});

test('resending for an already verified user reports already-verified', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/email/verification-notification')
        ->assertOk()
        ->assertJsonPath('status', 'already-verified');
});
