<?php

namespace App\Actions;

use App\Models\User;

/**
 * Apply an administrator-initiated change to a user.
 *
 * Shared by both transports — UserController::update and the GraphQL updateUser mutation —
 * so the update rules cannot drift between them. Callers pass already-validated data.
 */
class UpdateUser
{
    /**
     * @param  array<string, mixed>  $data  validated subset of name, email, password, role
     */
    public function __invoke(User $user, array $data): User
    {
        $emailChanged = array_key_exists('email', $data) && $user->changeEmail($data['email']);

        $user->fill(array_intersect_key($data, array_flip(['name', 'password'])));

        if (array_key_exists('role', $data)) {
            $user->role = $data['role'];
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return $user;
    }
}
