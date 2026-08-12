# Stack: Backend Auth — Sanctum Session

**Layer:** Backend / Auth
**Tool:** Laravel Sanctum — cookie-based SPA session authentication

The default authentication choice. The browser holds an encrypted session cookie, the API reads it, and no token is ever handled by JavaScript. Sanctum checks for the session cookie first and only falls back to an `Authorization` header — the two modes are independent, so choosing this one does not close the door on `sanctum-token.md` later for a mobile client.

**Fits when** the frontend is a first-party browser app on a domain you control, served as a client-rendered SPA. It is the strongest option available in that shape: an httpOnly cookie is not readable by script, so XSS cannot exfiltrate the credential.

**Does not fit** a server-rendered frontend, a mobile app, or a third-party API consumer. Under SSR the first request is made by a server with no cookie jar (`stacks/frontend/nuxt/addons/ssr.md`); that is the token choice's problem to solve, not this one's.

## The bootstrap

Four lines in `bootstrap/app.php`, each closing a specific failure:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();

    // API-only backend: never redirect guests to a login page; the
    // exception handler returns a 401 JSON response instead.
    $middleware->redirectGuestsTo(fn () => null);

    // The symmetric half: an authenticated request to a guest route
    // gets a 403 JSON response instead of a redirect to '/'.
    $middleware->redirectUsersTo(fn () => abort(403, 'Already authenticated.'));
})
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(
        fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
    );
})
```

- **`statefulApi()`** prepends Sanctum's stateful middleware to the `api` group. Without it, cookie authentication on `/api/*` does nothing and every request is a guest.
- **`redirectGuestsTo(fn () => null)`** — a headless app has no `login` named route, so an unauthenticated request that is not marked as JSON would throw a `RouteNotFoundException` while trying to redirect. Returning null means the handler produces a 401 instead. Worth a regression test; it fails in a way that looks unrelated to auth.
- **`redirectUsersTo(fn () => abort(403, ...))`** — without it, `RedirectIfAuthenticated` on the `guest` routes probes for a `dashboard`/`home` named route and falls back to a **302 to `/`** — an HTML redirect the SPA's error handling has no case for. Aborting inside the callback turns it into the 403 the frontend already routes (its "authenticated, not allowed" branch).
- **`shouldRenderJsonWhen(...)`** forces JSON error bodies rather than an HTML error page the frontend cannot parse.

## CORS

The frontend is on a different origin, and the requests are credentialed. `config/cors.php`:

```php
'paths' => [
    'api/*',
    'sanctum/csrf-cookie',
    'login', 'logout', 'register',
    'forgot-password', 'reset-password',
    'email/verification-notification',
],

// Credentialed CORS: scope to the front-end origin from the environment
// and fail closed if it is unset.
'allowed_origins' => array_values(array_filter([
    env('FRONTEND_URL'),
])),

'supports_credentials' => true,
```

- **`supports_credentials => true`** is mandatory — without it the browser sends no cookie.
- **`allowed_origins` can never be `['*']`** — the spec forbids the wildcard with credentials. Derive it from configuration and let it **fail closed**: an unset `FRONTEND_URL` produces an empty allowlist and every cross-origin request is refused. This is the deny-by-default CORS rule (`architecture.md`) made concrete.
- **The bare paths are not optional.** `login`, `logout`, and the rest live in `routes/web.php`, not under `/api` (`../http-layer.md`), so `api/*` does not cover them. Omitting them is the classic symptom: login is blocked by CORS while every authenticated call works.

## Session and stateful domains

Two settings that look like duplicates and are not:

| Setting                    | Value                                | Why                                                                                                                                            |
| -------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_DOMAIN`           | `localhost` / `.example.com`         | The **cookie's** domain. No port — cookies do not have ports, so one value covers API and frontend. A leading dot shares it across subdomains. |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:3000` / `app.example.com` | The **origins** Sanctum treats as first-party. Ports included, because origins have them.                                                      |

Getting the port wrong in either direction is the most common cause of "login returns 204 and the next request is still a guest."

The rest:

- `SESSION_DRIVER=database` (or redis) — not `file`, once more than one app instance runs.
- `SESSION_SECURE_COOKIE=true` in every environment served over HTTPS.
- `same_site` stays `lax`; cross-**site** would require `none` plus `secure`, and a shared registrable domain is the better answer.
- `config/auth.php` needs no `sanctum` guard entry — Sanctum registers its own. `config/sanctum.php` sets `'guard' => ['web']`.

## The flow

1. `GET /sanctum/csrf-cookie` — sets the `XSRF-TOKEN` cookie. Once, at app boot.
2. `POST /login` — validates, `$request->session()->regenerate()`, returns **`204 No Content`**.
3. Every subsequent `/api/*` request carries the session cookie plus the `X-XSRF-TOKEN` header.
4. `POST /logout` — `Auth::guard('web')->logout()`, then `invalidate()` and `regenerateToken()` on the session.

**Auth endpoints return 204, not a user object.** The client then fetches `/api/user`. One endpoint owns the shape of a user, so login, registration, and a page refresh all get the same thing.

## Links that land in the frontend

The backend sends the mail, but the links have to open the SPA. Three pieces:

```php
// config/app.php — fail closed in production
'frontend_url' => env('FRONTEND_URL', env('APP_ENV') === 'production' ? null : 'http://localhost:3000'),

// AppServiceProvider::boot()
ResetPassword::createUrlUsing(fn ($notifiable, string $token) =>
    config('app.frontend_url')."/password-reset/{$token}?email=".urlencode($notifiable->getEmailForPasswordReset())
);
```

Email verification is the mirror image: the signed route is verified on the backend, which then `redirect()->away(config('app.frontend_url').'/profile?verified=1')`.

## The frontend half

The client side of this contract is `stacks/frontend/nuxt/error-handling.md` or `stacks/frontend/nextjs/error-handling.md`, whichever frontend module the project chose — one fetcher sending `credentials: 'include'`, `Accept: application/json`, and `X-XSRF-TOKEN` on mutating verbs, with a single retry on `419`.

That **419** is this module's: Laravel returns it when the CSRF token expired but the session did not. It is recoverable and must never reach the user as an error.

## Testing

- `$this->postJson('/login', [...])` then `assertNoContent()` and `assertAuthenticatedAs($user)`.
- `actingAs($user)` for everything behind the guard — do not log in through HTTP in every test.
- Cover the 401-not-a-redirect behavior explicitly: `$this->get('/api/user')->assertUnauthorized()` with a plain `get`, not `getJson`. That is the request shape `redirectGuestsTo` exists for, and a JSON request would pass either way.
- Cover the mirror image: `actingAs($user)` then `postJson('/login', ...)` asserts 403, not a 302 — the request shape `redirectUsersTo` exists for.
- Cover login rate limiting — the throttle is part of the auth contract.

## Notes

- `HasApiTokens` on the model and the `personal_access_tokens` table are unused under this choice. Leave them out until a project adopts token auth; an unused credential table is attack surface with no owner.
- Session fixation is prevented by `regenerate()` on login and `invalidate()` on logout. Both, always — a logout that only forgets the user leaves a valid session id in the wild.
