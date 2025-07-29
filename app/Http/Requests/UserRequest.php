<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isCreating = $this->isMethod('POST');
        $userId = $this->route('user');

        return [
            'name' => [$isCreating ? 'required' : 'sometimes', 'string', 'max:255'],
            'email' => [
                $isCreating ? 'required' : 'sometimes',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($userId)
            ],
            'password' => [
                $isCreating ? 'required' : 'sometimes',
                'confirmed',
                Rules\Password::defaults()
            ],
            'role' => ['sometimes', 'in:' . User::USER_ROLE . ',' . User::ADMIN_ROLE],
        ];
    }
}
