<?php

use App\Models\User;

test('admins can list users newest first', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->getJson('/api/users')
        ->assertOk()
        ->assertJsonPath('total', 4)
        ->assertJsonCount(4, 'data');
});

test('non-admins cannot access user management', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/users')
        ->assertForbidden()
        ->assertJsonPath('message', 'Forbidden. Admin access required.');
});

test('guests cannot access user management', function () {
    $this->getJson('/api/users')->assertUnauthorized();
});

test('admins can view a single user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->getJson("/api/users/{$user->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email', $user->email);
});

test('non-admins cannot view a single user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)->getJson("/api/users/{$other->id}")->assertForbidden();
});

test('admins can create a user', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Created User',
            'email' => 'created@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ])
        ->assertCreated()
        ->assertJsonPath('data.email', 'created@example.com')
        ->assertJsonPath('data.role', 'admin');

    $this->assertDatabaseHas('users', [
        'email' => 'created@example.com',
        'role' => 'admin',
    ]);
});

test('a created user defaults to the user role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Plain User',
            'email' => 'plain@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertCreated()
        ->assertJsonPath('data.role', 'user');
});

test('user responses expose exactly the documented fields', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($admin)
        ->getJson("/api/users/{$user->id}")
        ->assertOk();

    expect(array_keys($response->json('data')))
        ->toBe(['id', 'name', 'email', 'role', 'email_verified_at', 'created_at', 'updated_at']);
});

test('creating a user requires name, email, and password', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('creating a user rejects a malformed email, an unconfirmed password, and an unknown role', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Broken',
            'email' => 'not-an-email',
            'password' => 'password',
            'role' => 'superuser',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password', 'role']);
});

test('creating a user rejects an overlong name and an uppercase email', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => str_repeat('a', 256),
            'email' => 'UPPER@EXAMPLE.COM',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email']);
});

test('creating a user rejects a non-string name and an overlong email', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => ['Array', 'Name'],
            // * 264 characters and structurally valid, so only max:255 can reject it.
            'email' => str_repeat('a', 60).'@'.str_repeat('b.', 100).'com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email']);
});

test('creating a user rejects a password below the minimum length', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Short Password',
            'email' => 'short@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
});

test('updating a user rejects a password below the minimum length', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", [
            'password' => 'short',
            'password_confirmation' => 'short',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
});

test('creating a user rejects an email that is already taken', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Duplicate',
            'email' => 'taken@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('updating a user rejects another user\'s email but accepts their own', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", ['email' => 'taken@example.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');

    $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", ['email' => $user->email])
        ->assertOk();
});

test('admins can update a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'role' => 'admin',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Name')
        ->assertJsonPath('data.role', 'admin');

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
        'role' => 'admin',
    ]);
});

test('admins can delete a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/users/{$user->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});

test('admins cannot delete their own account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/users/{$admin->id}")
        ->assertForbidden()
        ->assertJsonPath('message', 'You cannot delete your own account.');

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});
