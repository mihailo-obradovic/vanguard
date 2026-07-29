<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileController extends Controller
{
    /**
     * Update the authenticated user's own profile.
     */
    public function update(ProfileUpdateRequest $request): JsonResource
    {
        $user = $request->user();
        $data = $request->validated();

        $emailChanged = array_key_exists('email', $data) && $user->changeEmail($data['email']);

        $user->fill($request->safe()->only(['name', 'password']));
        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return UserResource::make($user);
    }
}
