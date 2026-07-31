# Self-service profile editing — design

**Date:** 2026-07-29
**Branch:** `feature/laravel-13-backend`

## Problem

Non-admin users cannot edit their own profile. The frontend "edit profile" form
saves via `PUT /api/users/{id}`, which resolves to `UserController@update`. That
route lives under the admin-only middleware group in `routes/api.php`:

```php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
```

`EnsureUserIsAdmin` (the `admin` alias) rejects non-admins with
`403 Forbidden. Admin access required.`, so _any_ profile edit (name, email,
password) fails — not just password changes. There is no self-service path for a
user to edit their own record.

## Goal

Give authenticated users a way to edit **their own** profile (name, email,
password) without admin rights, while:

- making it impossible to change `role` via the self-service path (no privilege
  escalation);
- requiring the current password before a password change;
- keeping email-verification status meaningful: changing an email address resets
  verification and triggers a fresh verification link.

Additionally, apply the same email-reverification behavior to the admin
`UserController@update` path so both paths are consistent — no way to end up
"verified" on an address that was never verified.

## Non-goals

- No changes to the admin `users` resource routing, `UserRequest`, or the
  `admin` middleware.
- No changes to registration, login, or the existing forgot/reset-password flow.

## Context / existing patterns

- Auth is session-based Sanctum (SPA): `RegisteredUserController` uses
  `Auth::login()` + `session()->regenerate()`. The `current_password`
  validation rule therefore validates against the default (web/session) guard.
- `User` implements `MustVerifyEmail` and exposes
  `sendEmailVerificationNotification()` (queued). The resend controller calls it
  directly; we reuse that.
- `User` is `#[Fillable(['name', 'email', 'password'])]` — `role` is **not**
  fillable, so mass-assignment escalation is already impossible; we also keep
  `role` out of the profile request rules as defense in depth.
- `password` uses the `hashed` cast, so assigning a plaintext password hashes it
  automatically.

## Design

### 1. Route

Add a self-service route beside the existing `GET /user`, under plain
`auth:sanctum` (no `admin`):

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', ...);                                   // existing
    Route::put('/profile', [ProfileController::class, 'update']);
});
```

The admin `users` group is untouched.

### 2. `User::changeEmail()` (shared)

Single source of truth for the "email changed → re-verify" rule, used by both
controllers:

```php
public function changeEmail(string $email): bool
{
    if ($email === $this->email) {
        return false;                 // no change → keep verified, no re-send
    }

    $this->email = $email;
    $this->email_verified_at = null;  // new address is unverified

    return true;                      // caller re-sends verification after save
}
```

The caller sends the verification notification **after** `save()` only when this
returns `true`.

### 3. `ProfileController@update`

Thin controller acting on `$request->user()` (a user can only ever edit
themselves — no `{user}` route binding):

```php
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
```

`email` is routed through `changeEmail()` and deliberately excluded from the
plain `fill()` so verification cannot be bypassed. `role` is never touched.

### 4. `ProfileUpdateRequest`

New form request, separate from the admin-only `UserRequest`:

```php
public function authorize(): bool
{
    return $this->user() !== null;
}

public function rules(): array
{
    return [
        'name'             => ['sometimes', 'string', 'max:255'],
        'email'            => ['sometimes', 'string', 'lowercase', 'email', 'max:255',
                               Rule::unique(User::class)->ignore($this->user()->id)],
        'password'         => ['sometimes', 'confirmed', Rules\Password::defaults()],
        'current_password' => ['required_with:password', 'current_password'],
    ];
}
```

All fields are `sometimes` → partial updates are allowed. `role` is absent by
design.

### 5. `UserController@update` (consistency)

Route the admin path's email through `changeEmail()` too, so admin email edits
also reset verification and send a link. Role handling and admin-only access are
unchanged:

```php
public function update(UserRequest $request, User $user): JsonResource
{
    $data = $request->validated();

    $emailChanged = array_key_exists('email', $data) && $user->changeEmail($data['email']);
    $user->fill($request->safe()->only(['name', 'password']));

    if (array_key_exists('role', $data)) {
        $user->role = $data['role'];
    }

    $user->save();

    if ($emailChanged) {
        $user->sendEmailVerificationNotification();
    }

    return UserResource::make($user);
}
```

## Error handling

- Unauthenticated → `401` (existing API behavior for unauthenticated requests).
- Validation failures (bad email, weak/unconfirmed password, wrong or missing
  `current_password` when changing password) → `422` with field errors.
- `role` in the profile payload is silently ignored (not in rules, not filled).

## Testing (TDD, feature tests)

Profile endpoint (`PUT /api/profile`):

1. Authenticated non-admin updates own `name` → `200`, name persisted.
2. Password change with correct `current_password` (+ `password_confirmation`)
   → `200`, new password works.
3. Password change with wrong `current_password` → `422`.
4. Password change with missing `current_password` → `422`.
5. Email change → `email_verified_at` nulled and verification notification sent
   (`Notification::fake()`).
6. Update that keeps the same email → verification **not** re-sent, stays
   verified.
7. `role` in payload is ignored → role unchanged (no escalation).
8. Unauthenticated request → `401`.

Admin path (`UserController@update`, consistency):

9. Admin changes a user's email → `email_verified_at` nulled + verification sent.
10. Admin edits only the user's name → verification untouched, not re-sent.

`User::changeEmail()` is exercised through these feature tests (returns
true/false, nulls verification on change).
