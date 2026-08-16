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

test('login requires an email and a password', function () {
    $this->postJson('/login', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});

// * The address is structurally valid at 264 characters, so only max:255 can reject it. Without the
// * bound an arbitrarily long string reaches the rate-limiter key and the credential lookup.
test('login rejects an overlong email', function () {
    $this->postJson('/login', [
        'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
        'password' => 'password',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

// * Mixed case must keep working: the column collates case-insensitively and the write endpoints'
// * `lowercase` rule is deliberately absent here.
test('login accepts an email in a different case', function () {
    $user = User::factory()->create(['email' => 'mixed@example.com']);

    $this->postJson('/login', [
        'email' => 'Mixed@Example.com',
        'password' => 'password',
    ])->assertNoContent();

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

    // * Each of the first five attempts must fail on credentials, not on the limiter — this pins the threshold at exactly five.
    // * The exact copy is asserted deliberately: the string is the only observable separating a credential failure from a lockout (both 422 on email).
    foreach (range(1, 5) as $ignored) {
        $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
    }

    $response = $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    // * Copy asserted as discriminator: no non-copy observable (header or field) marks this 422 as a lockout rather than a credential failure.
    expect($response->json('message'))->toContain('seconds');
});

test('login rejects a non-string password', function () {
    $user = User::factory()->create();

    // * Without the string rule this reaches Hash::check() as an array and the endpoint 500s.
    $this->postJson('/login', [
        'email' => $user->email,
        'password' => ['array', 'password'],
    ])->assertStatus(422)->assertJsonValidationErrors('password');
});

test('the lockout response reports the seconds remaining', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password']);
    }

    $response = $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password']);

    $response->assertStatus(422);
    // * Copy asserted as discriminator: no non-copy observable (header or field) marks this 422 as a lockout rather than a credential failure.
    expect($response->json('errors.email.0'))->toMatch('/try again in \d+ seconds/');
});

test('a successful login clears the failed attempt counter', function () {
    $user = User::factory()->create();

    // * Four failures, then a success that must reset the count — otherwise the four below lock out.
    foreach (range(1, 4) as $ignored) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password']);
    }

    $this->postJson('/login', ['email' => $user->email, 'password' => 'password'])->assertNoContent();
    $this->postJson('/logout');

    // * Exact copy asserted as discriminator: the string is the only observable proving these fail on credentials, not the limiter.
    foreach (range(1, 4) as $ignored) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
    }
});

test('the lockout is scoped to the email address', function () {
    $locked = User::factory()->create();
    $other = User::factory()->create();

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/login', ['email' => $locked->email, 'password' => 'wrong-password']);
    }

    // * Exact copy asserted as discriminator: the string is the only observable proving the other email fails on credentials, not the limiter.
    $this->postJson('/login', ['email' => $other->email, 'password' => 'wrong-password'])
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

test('the lockout is scoped to the client address', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password']);
    }

    // * Exact copy asserted as discriminator: the string is the only observable proving the other client fails on credentials, not the limiter.
    $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.7'])
        ->postJson('/login', ['email' => $user->email, 'password' => 'wrong-password'])
        ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
});

test('authenticated requests to guest routes return 403 instead of redirecting', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertForbidden();
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

test('logging out flushes the session and issues a fresh CSRF token', function () {
    $user = User::factory()->create();

    // * Comparing session ids proves nothing here — a test request carries no session cookie, so
    // * the id differs either way. Flushed data and a reissued token are the observable effects.
    $this->actingAs($user)->session(['locale' => 'sr-Latn']);

    $this->postJson('/logout')->assertNoContent();

    expect(session()->has('locale'))->toBeFalse();
    expect(session()->has('_token'))->toBeTrue();
});
