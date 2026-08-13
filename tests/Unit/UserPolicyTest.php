<?php

use App\Enums\Role;
use App\Models\User;
use App\Policies\UserPolicy;

// * Plain instances, no factory/DB: the policy reads only role and identity.
function policyUser(int $id, Role $role): User
{
    $user = new User;
    $user->id = $id;
    $user->role = $role;

    return $user;
}

test('admins may list and view users', function () {
    $admin = policyUser(1, Role::Admin);
    $other = policyUser(2, Role::User);

    $policy = new UserPolicy;

    expect($policy->viewAny($admin))->toBeTrue()
        ->and($policy->view($admin, $other))->toBeTrue();
});

test('admins may update and delete other users', function () {
    $admin = policyUser(1, Role::Admin);
    $other = policyUser(2, Role::User);

    $policy = new UserPolicy;

    expect($policy->update($admin, $other))->toBeTrue()
        ->and($policy->delete($admin, $other))->toBeTrue();
});

test('admins may not delete their own account', function () {
    $admin = policyUser(1, Role::Admin);

    expect((new UserPolicy)->delete($admin, $admin))->toBeFalse();
});

test('standard users are denied everywhere', function () {
    $actor = policyUser(1, Role::User);
    $other = policyUser(2, Role::User);

    $policy = new UserPolicy;

    expect($policy->viewAny($actor))->toBeFalse()
        ->and($policy->view($actor, $other))->toBeFalse()
        ->and($policy->update($actor, $other))->toBeFalse()
        ->and($policy->delete($actor, $other))->toBeFalse();
});
