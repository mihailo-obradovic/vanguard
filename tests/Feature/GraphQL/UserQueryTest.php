<?php

use App\Models\User;

test('admins can list users newest first', function () {
    $admin = User::factory()->admin()->create(['created_at' => '2026-01-01 10:00:00']);
    User::factory()->create(['created_at' => '2026-01-02 10:00:00']);
    $newest = User::factory()->create(['created_at' => '2026-01-03 10:00:00']);

    $this->actingAs($admin)
        ->graphQL('{ users { id name email role } }')
        ->assertOk()
        ->assertGraphQLErrorFree()
        ->assertJsonCount(3, 'data.users')
        ->assertJsonPath('data.users.0.id', $newest->id);
});

test('the graphql payload for a user matches the rest payload', function () {
    $admin = User::factory()->admin()->create();

    $rest = $this->actingAs($admin)
        ->getJson('/api/users')
        ->json('data.0');

    $graphql = $this->actingAs($admin)
        ->graphQL('{ users { id name email role email_verified_at created_at updated_at } }')
        ->json('data.users.0');

    // * The single outward contract: both transports serialize through UserResource, so a
    // * client can validate either response against one schema.
    expect($graphql)->toEqual($rest);
});

test('non-admins cannot list users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->graphQL('{ users { id } }')
        ->assertOk()
        ->assertJsonPath('data.users', null)
        ->assertJsonPath('errors.0.extensions.status', 403);
});

test('guests cannot list users', function () {
    $this->graphQL('{ users { id } }')
        ->assertOk()
        ->assertJsonPath('data.users', null)
        ->assertJsonPath('errors.0.extensions.status', 401);
});
