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

test('registration rejects a password below the minimum length', function () {
    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'short@example.com',
        'password' => 'short',
        'password_confirmation' => 'short',
    ])->assertStatus(422)->assertJsonValidationErrors('password');
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
