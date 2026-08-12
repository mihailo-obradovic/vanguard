<?php

namespace App\GraphQL\Mutations;

use App\Actions\UpdateUser as UpdateUserAction;
use App\GraphQL\ResourcePayload;
use App\Http\Resources\UserResource;
use App\Models\User;

/**
 * Resolver for the `updateUser` mutation.
 *
 * Thin by contract: authorization is declared on the field (@canFind), validation lives in
 * UpdateUserValidator, and the change itself belongs to the shared action. What is left here
 * is loading the model and shaping the response.
 */
class UpdateUser
{
    public function __construct(
        private readonly UpdateUserAction $updateUser,
    ) {}

    /**
     * @param  array{id: int, name?: string, email?: string, password?: string, password_confirmation?: string, role?: string}  $args
     * @return array<string, mixed>
     */
    public function __invoke(mixed $root, array $args): array
    {
        $user = User::findOrFail($args['id']);

        $data = array_intersect_key($args, array_flip(['name', 'email', 'password', 'role']));

        return ResourcePayload::of(
            UserResource::make(($this->updateUser)($user, $data))
        );
    }
}
