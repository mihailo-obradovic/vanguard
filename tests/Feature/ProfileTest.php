<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('a user can update their own name', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', ['name' => 'New Name'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');

    expect($user->fresh()->name)->toBe('New Name');
});

test('a user can change their password with the correct current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertOk();

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

test('a password change fails with the wrong current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('current_password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a password change requires the current password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('current_password');
});

test('a password change fails when the confirmation does not match', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a profile update rejects an email belonging to another user', function () {
    $user = User::factory()->create();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($user)
        ->putJson('/api/profile', ['email' => 'taken@example.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('a profile update rejects an overlong name and an uppercase email', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'name' => str_repeat('a', 256),
            'email' => 'UPPER@EXAMPLE.COM',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email']);
});

test('a profile update rejects a non-string name and an overlong email', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'name' => ['Array', 'Name'],
            // * 264 characters and structurally valid, so only max:255 can reject it.
            'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email']);
});

test('a password change rejects a password below the minimum length', function () {
    $user = User::factory()->create();

    // * The current password is correct, so the only rule left to reject this is the length minimum.
    $this->actingAs($user)
        ->putJson('/api/profile', [
            'current_password' => 'password',
            'password' => 'shortpw',
            'password_confirmation' => 'shortpw',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a profile update rejects a malformed email', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', ['email' => 'not-an-email'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('changing email resets verification and sends a new link', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', ['email' => 'changed@example.com'])
        ->assertOk()
        ->assertJsonPath('data.email', 'changed@example.com');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
    Notification::assertSentTo($user, VerifyEmailNotification::class);
});

test('keeping the same email does not reset verification', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'name' => 'Same Email',
            'email' => $user->email,
        ])
        ->assertOk();

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Notification::assertNothingSent();
});

test('a user cannot escalate their own role via the profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->putJson('/api/profile', [
            'name' => 'Sneaky',
            'role' => 'admin',
        ])
        ->assertOk();

    expect($user->fresh()->isAdmin())->toBeFalse();
});

test('guests cannot update a profile', function () {
    $this->putJson('/api/profile', ['name' => 'Nope'])->assertUnauthorized();
});
