<?php

use App\Models\User;

test('users can authenticate', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertNoContent();
    $this->assertAuthenticatedAs($user);
});

test('users cannot authenticate with an invalid password', function () {
    $user = User::factory()->create();

    $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');

    $this->assertGuest();
});

test('login is rate limited after five failed attempts', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    $response = $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    expect($response->json('message'))->toContain('seconds');
});

test('authenticated users can fetch the current user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email)
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role', 'email_verified_at', 'created_at', 'updated_at']])
        ->assertJsonMissingPath('data.password');
});

test('guests cannot fetch the current user', function () {
    $this->getJson('/api/user')->assertUnauthorized();
});

test('unauthenticated api requests return 401 instead of redirecting to a login route', function () {
    // * A non-JSON request must not try to redirect to a (non-existent) login route.
    $this->get('/api/user')->assertUnauthorized();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/logout')->assertNoContent();

    $this->assertGuest();
});
