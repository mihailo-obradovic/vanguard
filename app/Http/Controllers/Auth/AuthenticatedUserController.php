<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthenticatedUserController extends Controller
{
    /**
     * Return the authenticated user.
     */
    public function __invoke(Request $request): JsonResource
    {
        return UserResource::make($request->user());
    }
}
