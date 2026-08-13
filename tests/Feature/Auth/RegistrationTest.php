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

test('registration requires a unique email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'taken@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});
