<?php

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Support\Facades\Notification;

const UPDATE_USER = /** @lang GraphQL */ '
    mutation ($id: Int!, $name: String, $email: String, $role: String) {
        updateUser(id: $id, name: $name, email: $email, role: $role) {
            id
            name
            email
            role
            email_verified_at
        }
    }
';

test('admins can update a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'name' => 'Renamed', 'role' => 'admin'])
        ->assertOk()
        ->assertGraphQLErrorFree()
        ->assertJsonPath('data.updateUser.name', 'Renamed')
        ->assertJsonPath('data.updateUser.role', 'admin');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Renamed', 'role' => 'admin']);
});

test('omitted arguments leave their fields untouched', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['name' => 'Original']);

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'role' => 'admin'])
        ->assertGraphQLErrorFree()
        ->assertJsonPath('data.updateUser.name', 'Original');
});

test('changing the email resets verification and queues the notice', function () {
    Notification::fake();

    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'email' => 'changed@example.com'])
        ->assertGraphQLErrorFree()
        ->assertJsonPath('data.updateUser.email', 'changed@example.com')
        ->assertJsonPath('data.updateUser.email_verified_at', null);

    Notification::assertSentTo($user->fresh(), VerifyEmailNotification::class);
});

test('a duplicate email is reported as a validation error keyed by field', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'email' => 'taken@example.com'])
        ->assertOk()
        ->assertGraphQLValidationError('email', 'The email has already been taken.')
        ->assertJsonPath('errors.0.extensions.status', 422);
});

test('an overlong name and an uppercase email are rejected', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'name' => str_repeat('a', 256), 'email' => 'UPPER@EXAMPLE.COM'])
        ->assertOk()
        ->assertJsonPath('errors.0.extensions.status', 422);
});

test('an invalid role is rejected', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => $user->id, 'role' => 'superuser'])
        ->assertJsonPath('errors.0.extensions.status', 422);
});

test('non-admins cannot update a user', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->graphQL(UPDATE_USER, ['id' => $other->id, 'name' => 'Hacked'])
        ->assertJsonPath('errors.0.extensions.status', 403);

    $this->assertDatabaseMissing('users', ['name' => 'Hacked']);
});

test('guests cannot update a user', function () {
    $user = User::factory()->create();

    $this->graphQL(UPDATE_USER, ['id' => $user->id, 'name' => 'Hacked'])
        ->assertJsonPath('errors.0.extensions.status', 401);

    $this->assertDatabaseMissing('users', ['name' => 'Hacked']);
});

test('updating an unknown user fails before the resolver runs', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->graphQL(UPDATE_USER, ['id' => 99999, 'name' => 'Ghost'])
        ->assertJsonPath('errors.0.extensions.status', 404);
});
