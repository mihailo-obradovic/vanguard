<?php

namespace App\GraphQL\Validators;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Nuwave\Lighthouse\Validation\Validator;

/**
 * The FormRequest equivalent for the `updateUser` mutation.
 *
 * Mirrors the update branch of App\Http\Requests\UserRequest — including the unique rule
 * that has to ignore the user being edited, which is why this is a class rather than a
 * "rules" directive in the schema. Rules changed here must be changed there too; the two
 * transports are expected to reject the same input.
 */
class UpdateUserValidator extends Validator
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->arg('id')),
            ],
            'password' => ['sometimes', 'confirmed', Rules\Password::defaults()],
            'role' => ['sometimes', Rule::enum(Role::class)],
        ];
    }
}
