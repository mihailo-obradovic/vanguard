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

    $this->actingAs($user)->getJson('/api/users')->assertForbidden();
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
