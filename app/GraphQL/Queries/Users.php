<?php

namespace App\GraphQL\Queries;

use App\GraphQL\ResourcePayload;
use App\Http\Resources\UserResource;
use App\Models\User;

/**
 * Resolver for the `users` query.
 *
 * Authorization is declared on the field in graphql/schema.graphql (@canModel), so this
 * runs only for administrators. Ordering matches UserController::index.
 */
class Users
{
    /**
     * @return list<array<string, mixed>>
     */
    public function __invoke(): array
    {
        return ResourcePayload::ofMany(
            UserResource::collection(User::latest()->get())
        );
    }
}
