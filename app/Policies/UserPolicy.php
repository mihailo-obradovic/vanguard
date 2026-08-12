<?php

namespace App\Policies;

use App\Models\User;

/**
 * User management is administrator-only.
 *
 * REST enforces this on the route with the `admin` middleware; GraphQL has one endpoint
 * serving fields with different requirements, so it authorizes per field against this
 * policy. Both express the same rule through User::isAdmin().
 */
class UserPolicy
{
    /**
     * Determine whether the actor may list users.
     */
    public function viewAny(User $actor): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Determine whether the actor may view a user.
     */
    public function view(User $actor, User $user): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Determine whether the actor may update a user.
     */
    public function update(User $actor, User $user): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Determine whether the actor may delete a user.
     *
     * Administrators cannot delete their own account — the same guard UserController::destroy
     * applies, kept here so the rule holds for any transport that adopts this policy.
     */
    public function delete(User $actor, User $user): bool
    {
        return $actor->isAdmin() && ! $user->is($actor);
    }
}
