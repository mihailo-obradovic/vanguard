<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
    /**
     * Display a listing of all users, newest first.
     */
    public function index(): ResourceCollection
    {
        $users = User::latest()->get();

        return UserResource::collection($users)->additional([
            'total' => $users->count(),
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(UserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = new User;
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password'];
        $user->role = $data['role'] ?? Role::User;
        $user->save();

        return UserResource::make($user)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResource
    {
        return UserResource::make($user);
    }

    /**
     * Update the specified user.
     */
    public function update(UserRequest $request, User $user): JsonResource
    {
        $data = $request->validated();

        $user->fill($request->safe()->only(['name', 'email', 'password']));

        if (array_key_exists('role', $data)) {
            $user->role = $data['role'];
        }

        $user->save();

        return UserResource::make($user);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): Response|JsonResponse
    {
        if ($user->is($request->user())) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->delete();

        return response()->noContent();
    }
}
