# Laravel — The HTTP Layer

**Layer:** Backend
**Tool:** Laravel 13 — controllers, FormRequests, API Resources

The request path, from route to JSON. Three classes own it and none of them owns business logic: a **FormRequest** decides whether the request is allowed and well-formed, a **controller** moves data between the request and the domain, and an **API Resource** decides what goes back out. Read this when adding or changing an endpoint.

## Controllers

A controller action reads validated input, calls the domain, and returns a Resource. If it contains a conditional about business meaning, that conditional belongs on the model or in a service.

```php
public function update(UserRequest $request, User $user): JsonResource
{
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

- **Declare the return type** — `JsonResource`, `ResourceCollection`, `JsonResponse`, `Response`, or a union where an action genuinely has two shapes. It is the cheapest contract documentation available and static analysis reads it.
- **Route-model binding** over `findOrFail()`: type-hint `User $user` and the 404 is handled before the action runs.
- **`$request->safe()->only([...])`** for mass assignment, never `$request->all()`. `validated()` is for reading individual values; `safe()->only()` is for deciding which of them may be filled.
- **`Response::HTTP_CREATED`**, not `201`. Status codes are a contract, and the constant names it.
- Never call `Hash::make()` in a controller — the model's `hashed` cast owns that (`models.md`).

## FormRequests

`authorize()` is real authorization, not a formality. Returning `false` produces a 403 before `rules()` ever runs, which means an unauthorized caller never learns whether their payload would have validated.

```php
public function authorize(): bool
{
    return $this->user() && $this->user()->isAdmin();
}

public function rules(): array
{
    $required = $this->isMethod('POST') ? 'required' : 'sometimes';

    return [
        'name' => [$required, 'string', 'max:255'],
        'email' => [
            $required, 'string', 'lowercase', 'email', 'max:255',
            Rule::unique(User::class)->ignore($this->route('user')),
        ],
        'password' => [$required, 'confirmed', Rules\Password::defaults()],
        'role' => ['sometimes', Rule::enum(Role::class)],
    ];
}
```

- **Array syntax, never pipe strings.** `['required', 'string']` composes with rule objects; `'required|string'` does not, and it breaks the moment a value contains a `|`.
- **Rule objects over hand-written strings**: `Rule::enum()`, `Rule::unique(Model::class)->ignore(...)`, `Rules\Password::defaults()`. `Password::defaults()` is set once in a service provider, so password policy is one decision rather than one per endpoint.
- **One request class per resource, switching on the verb** (`$this->isMethod('POST') ? 'required' : 'sometimes'`) is preferred to a `StoreUserRequest`/`UpdateUserRequest` pair when the rule sets differ only in requiredness — one place to change when a field is added.
- Leave `messages()` alone unless a specific message is genuinely wrong. Framework defaults are translated and consistent; a hand-written set drifts.
- **A field with no rule is a field the endpoint does not accept.** This is the privilege-escalation guard: a self-service profile request simply has no `role` rule, so no payload can set one. Test it — the absence is easy to un-notice in review.

## API Resources

A Resource is the outward contract. It lists fields explicitly.

```php
/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'created_at' => $this->created_at,
        ];
    }
}
```

- **Never `parent::toArray()`** — it publishes every column, so the next migration changes the API without anyone deciding to.
- **`@mixin` the model** so `$this->` resolves in editors and static analysis.
- **Unwrap enums to `->value`.** The JSON contract is a plain string; a consumer should not have to know PHP backed enums exist.
- **One envelope for the whole API.** Resources wrap in `data` by default. Either keep that everywhere or call `JsonResource::withoutWrapping()` once in a service provider — but never mix, or every client needs two parsers for the same model. Returning `$request->user()` raw from a `/user` route is the usual way this gets broken; return `UserResource::make($request->user())`.
- Collection metadata goes through `->additional([...])`, not a hand-built array wrapper.

## Route files

Session-based auth splits the routes in a way that surprises people, so it is worth stating plainly:

- **`routes/api.php`** — everything under `/api`, guarded by `auth:sanctum`. All data endpoints.
- **`routes/web.php`** — the session-establishing endpoints (`login`, `logout`, `register`, password reset, email verification), unprefixed. They need the full web middleware stack: session, cookie encryption, CSRF.

That split is why CORS has to list those bare paths explicitly alongside `api/*` (`auth/sanctum-session.md`). A token-authenticated API does not have the problem — see `auth/sanctum-token.md`.

Group by middleware rather than repeating it per route, and name only the routes the framework resolves by name (`verification.verify`, `verification.send`):

```php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
```

## Status codes

| Outcome | Status | Returned by |
| --- | --- | --- |
| Read succeeded | 200 | `Resource::make()` / `Resource::collection()` |
| Resource created | 201 | `->response()->setStatusCode(Response::HTTP_CREATED)` |
| Succeeded, nothing to return | 204 | `response()->noContent()` |
| Not authenticated | 401 | the auth middleware |
| Authenticated, not allowed | 403 | FormRequest `authorize()` or route middleware |
| Not found | 404 | route-model binding |
| Validation failed | 422 | FormRequest, or `ValidationException::withMessages()` |

422 bodies are the frontend's inline field errors, not a toast — the frontend module holds that half of the contract.
