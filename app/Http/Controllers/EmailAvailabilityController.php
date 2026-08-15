<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailAvailabilityRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class EmailAvailabilityController extends Controller
{
    /**
     * Report whether an email address is free to claim.
     *
     * A hint for the forms, not a gate: the `unique` rules on the write endpoints
     * stay authoritative, and an address free here can still be taken by the time
     * the form submits.
     */
    public function __invoke(EmailAvailabilityRequest $request): JsonResponse
    {
        $ignoreId = $request->integer('ignore_id');

        $taken = User::query()
            ->where('email', $request->string('email'))
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists();

        return response()->json(['available' => ! $taken]);
    }
}
