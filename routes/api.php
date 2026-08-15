<?php

use App\Http\Controllers\Auth\AuthenticatedUserController;
use App\Http\Controllers\EmailAvailabilityController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// * Public: the register form needs it before a session exists. Throttled because of that, and
// * because it is typed against — one request per pause in typing, not per keystroke.
Route::get('/email-availability', EmailAvailabilityController::class)
    ->middleware('throttle:30,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', AuthenticatedUserController::class);

    Route::put('/profile', [ProfileController::class, 'update']);
});

// * Admin-only user management.
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
