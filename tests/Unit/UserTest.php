<?php

use App\Enums\Role;
use App\Models\User;
use Tests\TestCase;

// * The datetime cast resolves its format through the connection, so this file needs the booted app (still no database).
uses(TestCase::class);

test('role helpers reflect the assigned role', function () {
    $admin = new User;
    $admin->role = Role::Admin;

    $user = new User;
    $user->role = Role::User;

    expect($admin->isAdmin())->toBeTrue()
        ->and($admin->isUser())->toBeFalse()
        ->and($user->isAdmin())->toBeFalse()
        ->and($user->isUser())->toBeTrue();
});

test('changing the email to the same address is a no-op', function () {
    $user = new User;
    $user->email = 'same@example.com';
    $user->email_verified_at = now();

    expect($user->changeEmail('same@example.com'))->toBeFalse()
        ->and($user->email_verified_at)->not->toBeNull();
});

test('changing the email resets verification and reports the change', function () {
    $user = new User;
    $user->email = 'old@example.com';
    $user->email_verified_at = now();

    expect($user->changeEmail('new@example.com'))->toBeTrue()
        ->and($user->email)->toBe('new@example.com')
        ->and($user->email_verified_at)->toBeNull();
});
