# app/ — Laravel application core

The Laravel 13 (PHP 8.3) application namespace. The API is JSON-only — no Blade UI, no guest redirects; the Nuxt SPA in `web/` is the only consumer.

Entry points live outside this folder: routes in `routes/api.php` and `routes/web.php` (session-auth endpoints), framework wiring in `bootstrap/app.php` (JSON-only rendering, middleware aliases), config in `config/`. Tests live in `tests/` (Pest 5: `Feature/` with `RefreshDatabase`, `Unit/` plain).

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `Actions/` — domain operations shared by more than one transport; each is a single invokable class taking already-validated data.
- `Enums/Role.php` — persisted user roles (backed enum); values are stored in the database.
- `GraphQL/` — the Lighthouse layer: `Queries/` and `Mutations/` resolvers (thin, named after their schema field), `Validators/` (the FormRequest equivalent), `ErrorHandlers/`, and `ResourcePayload.php`, which renders an API Resource to the same array REST sends. The schema itself is `graphql/schema.graphql` at the repo root.
- `Http/Controllers/` — thin controllers; `Auth/` holds the Breeze-style session controllers (register, login, logout, password reset, email verification).
- `Http/Middleware/EnsureUserIsAdmin.php` — the `admin` route alias.
- `Http/Requests/` — FormRequests own validation and authorization.
- `Http/Resources/UserResource.php` — API response shaping, for both transports.
- `Models/User.php` — Eloquent model using PHP attribute casts.
- `Notifications/` — password-reset and email-verification notifications, queued.
- `Policies/UserPolicy.php` — the admin rule the GraphQL `@can*` directives authorize against.
- `Providers/AppServiceProvider.php` — app-level bindings.

## Governing documents

- Controllers, FormRequests, Resources, routes → `catalyst/stacks/backend/laravel/http-layer.md`
- Models, enums, migrations, persistence → `catalyst/stacks/backend/laravel/models.md`
- Session auth flow (Sanctum stateful SPA) → `catalyst/stacks/backend/laravel/auth/sanctum-session.md`
- Testing (Pest 5) → `catalyst/stacks/backend/laravel/testing.md`
- Module overview and runtime bindings → `catalyst/stacks/backend/laravel/laravel.md`

## Local invariants

- Validation and authorization live in FormRequests, not controllers; responses go through Resources.
- A rule that both transports enforce has one implementation: the Resource for output, an `Actions/` class for the change, the policy for access. A GraphQL resolver that reimplements controller logic is a bug — see `catalyst/features/007_graphql-api.md`.
- GraphQL resolvers return `ResourcePayload` arrays, not models — which means Lighthouse's relationship directives (`@hasMany`, `@belongsTo`) and N+1 batching cannot be used on those types. Do not add a nested relationship field without a new decision record; the exit path is priced in `catalyst/decisions/007_infra_graphql-alongside-rest.md`.
- Editing `graphql/schema.graphql` outside the local environment needs `php artisan lighthouse:clear-cache`; the compiled schema is cached everywhere except `local` (tests disable it in `phpunit.xml`).
- Async work (queued notifications) uses Laravel's built-in queue (database driver) — there is no separate worker deployable.
- The public API surface, the session/auth contract, and the DB schema are protected areas — declared in `catalyst/architecture.md` (Protected Areas); state impact and get explicit agreement before touching them.
