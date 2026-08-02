<?php

use App\Http\Controllers\Auth\AuthenticatedUserController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', AuthenticatedUserController::class);

    Route::put('/profile', [ProfileController::class, 'update']);
});

// Admin-only user management.
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
