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

test('registration requires a unique email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/register', [
        'name' => 'Test User',
        'email' => 'taken@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});
