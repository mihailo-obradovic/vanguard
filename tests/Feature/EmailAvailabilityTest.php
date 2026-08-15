<?php

use App\Models\User;

test('an unclaimed email is available', function () {
    $this->getJson('/api/email-availability?email=free@example.com')
        ->assertOk()
        ->assertExactJson(['available' => true]);
});

test('a claimed email is not available', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->getJson('/api/email-availability?email=taken@example.com')
        ->assertOk()
        ->assertExactJson(['available' => false]);
});

// * Without this the profile and admin-edit forms would tell a user their own address is taken.
test('the ignored user does not make their own email unavailable', function () {
    $user = User::factory()->create(['email' => 'mine@example.com']);

    $this->getJson("/api/email-availability?email=mine@example.com&ignore_id={$user->id}")
        ->assertOk()
        ->assertExactJson(['available' => true]);
});

test('ignoring one user does not hide another holding the address', function () {
    $holder = User::factory()->create(['email' => 'shared@example.com']);
    $other = User::factory()->create();

    $this->getJson("/api/email-availability?email=shared@example.com&ignore_id={$other->id}")
        ->assertOk()
        ->assertExactJson(['available' => false]);

    expect($holder->fresh())->not->toBeNull();
});

test('the check is reachable without a session', function () {
    // * The register form asks before anyone is signed in; a 401 here would make it useless.
    $this->assertGuest();

    $this->getJson('/api/email-availability?email=guest@example.com')->assertOk();
});

test('the check requires an email', function () {
    $this->getJson('/api/email-availability')
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('the check rejects a malformed email', function () {
    $this->getJson('/api/email-availability?email=not-an-email')
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('the check rejects an overlong email', function () {
    $email = str_repeat('a', 60).'@'.str_repeat('b.', 100).'com';

    $this->getJson('/api/email-availability?email='.urlencode($email))
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

test('the check rejects a non-integer ignore_id', function () {
    $this->getJson('/api/email-availability?email=free@example.com&ignore_id=abc')
        ->assertStatus(422)
        ->assertJsonValidationErrors('ignore_id');
});

// * An id nobody holds narrows nothing; it must not turn into a 404 or a 422 on a public read.
test('an unknown ignore_id is ignored rather than rejected', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->getJson('/api/email-availability?email=taken@example.com&ignore_id=999999')
        ->assertOk()
        ->assertExactJson(['available' => false]);
});
