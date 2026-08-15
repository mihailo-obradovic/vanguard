<?php

use App\Enums\Role;
use App\Models\User;

test('new users can register', function () {
    $response = $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'newuser@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertNoContent();
    $this->assertAuthenticated();

    $this->assertDatabaseHas('users', [
        'email' => 'newuser@example.com',
        'role' => Role::User->value,
    ]);
});

test('registration requires a name, an email, and a password', function () {
    $this->postJson('/register', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('registration rejects an overlong name, an uppercase email, and an unconfirmed password', function () {
    $this->postJson('/register', [
        'name' => str_repeat('a', 256),
        'email' => 'UPPER@EXAMPLE.COM',
        'password' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('registration rejects a malformed email', function () {
    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'not-an-email',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

test('registration rejects a non-string name and an overlong email', function () {
    $this->postJson('/register', [
        'name' => ['Array', 'Name'],
        // * 264 characters and structurally valid, so only max:255 can reject it.
        'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors(['name', 'email']);
});

// * Seven characters, not an arbitrary short string: paired with the eight-character case below it
// * pins the minimum at exactly 8, which a five-character literal would leave free to drift to 6 or 7.
test('registration rejects a password below the minimum length', function () {
    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'short@example.com',
        'password' => 'shortpw',
        'password_confirmation' => 'shortpw',
    ])->assertStatus(422)->assertJsonValidationErrors('password');
});

test('registration accepts a password of exactly the minimum length', function () {
    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'eight@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNoContent();

    $this->assertDatabaseHas('users', ['email' => 'eight@example.com']);
});

// * bcrypt truncates past 72 bytes, so an unbounded password would be accepted and then only
// * partly honoured. The max makes that refusal explicit rather than silent.
test('registration rejects a password above the maximum length', function () {
    $password = str_repeat('a', 256);

    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'long@example.com',
        'password' => $password,
        'password_confirmation' => $password,
    ])->assertStatus(422)->assertJsonValidationErrors('password');
});

test('registration accepts a password of exactly the maximum length', function () {
    $password = str_repeat('a', 255);

    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'max@example.com',
        'password' => $password,
        'password_confirmation' => $password,
    ])->assertNoContent();

    $this->assertDatabaseHas('users', ['email' => 'max@example.com']);
});

test('registration requires a unique email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'taken@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});
