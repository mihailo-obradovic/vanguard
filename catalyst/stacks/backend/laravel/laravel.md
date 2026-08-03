# Stack: Backend — PHP / Laravel

**Layer:** Backend
**Tool:** PHP 8.3+ · Laravel 13 · Eloquent · Pest 5

The PHP-side backend module: a **headless JSON API** — no Blade views, no Inertia, no server-rendered pages, paired with a separate frontend that talks to it over HTTP. Names the tools and binds the Universal Rules to them; it never restates a Universal Rule. Swap it for another backend module by decision record — the Universal Rules bind the replacement unchanged.

## Runtime

- PHP 8.3+.
- Dependencies managed by Composer, with the committed `composer.lock` as the single source of pinned versions (the reproducible-builds rule made concrete); CI installs with `composer install` and never `composer update`, so a stale lockfile fails the build instead of silently resolving different versions.
- Return types on every method; parameter types on everything the framework does not resolve for you.
- Format with Pint on the `laravel` preset; do not hand-format. Pint is the formatter of record and runs from `vendor/bin/pint` — not from an editor setting.
- Migrations are Laravel migrations (the migration tool follows the backend framework, not the database) — see the Persistence module for the database itself.
- Configuration is read through `config()`, never `env()` outside `config/` (Avoid By Default) — the central-configuration-entry-point rule made concrete.

## Structure

```text
Request → routes → middleware → FormRequest → controller → model / service → DB
                                                   ↓
                                            API Resource → JSON
```

```text
app/
  Enums/          string-backed enums, cast on the model
  Http/
    Controllers/  transport only, no business logic
    Middleware/   cross-cutting request gates
    Requests/     FormRequests — validation and authorization
    Resources/    response shaping, the outward contract
  Models/         Eloquent models and their domain methods
  Notifications/  queued notification classes
  Policies/       per-record authorization, once ownership rules exist
  Providers/
bootstrap/app.php middleware stack, exception rendering, routing
routes/           api.php (data) and web.php (session-establishing auth)
database/         migrations, factories, seeders
tests/            Pest — Feature/ and Unit/
```

- Business logic lives on the model as intention-revealing methods (`$user->changeEmail(...)`), not in the controller. It moves to an `app/Services/` class when it spans several models or owns a transaction boundary — that is the trigger, not file size.
- **No repository layer.** Eloquent is already the persistence abstraction; the Universal Rule asks that business rules stay out of transport and storage-mapping code, not that Eloquent be hidden.
- Scaffold order: `Enums` → `Models` (+ migration and factory) → `Requests` → `Resources` → `Controllers` → routes → wire middleware and exception rendering in `bootstrap/app.php`.

## Tool Bindings

| Universal Rule         | Implemented by                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Validation             | FormRequest classes, array-syntax rules; never inlined in a controller                                                                    |
| Contracts              | API Resources are the response contract; version in path (`/api/v1`)                                                                      |
| Pagination             | `->paginate()`; `page` / `per_page` query params, one convention per project                                                              |
| Error handling         | `withExceptions()` in `bootstrap/app.php` — one central place, JSON for API requests                                                      |
| Configuration          | `config/*.php` files reading `env()`; nothing else calls `env()`                                                                          |
| Persistence            | Eloquent + Laravel migrations                                                                                                             |
| Transaction boundaries | `DB::transaction()` in the service or model method, never in a controller                                                                 |
| Async work             | Laravel queues over the same codebase — see Queued Work below                                                                             |
| Dead letter            | the `failed_jobs` table after the retry budget; redrive with `queue:retry`, never an ad hoc re-dispatch                                   |
| Idempotency            | a natural key on the job payload, or `ShouldBeUnique` where the key is the model                                                          |
| Logging                | the `Log` facade (Monolog); the `stderr` channel in containers, so the platform collects it                                               |
| Observability          | `/up` from `withRouting(health: ...)` for liveness; readiness is a separate route that checks the dependencies the service actually needs |
| Auth seam              | the `auth/` choice below; `auth:sanctum` on the protected route groups                                                                    |
| Authorization          | FormRequest `authorize()` plus route middleware; Policies once per-record ownership rules appear                                          |
| Tests                  | Pest 5; feature tests against the Persistence module's real engine                                                                        |

## Module Documents

| Document           | What it holds                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `laravel.md`       | This document — the module contract and approved libraries                                          |
| `http-layer.md`    | The request path: thin controllers, FormRequests, Resources, status codes, and the route file split |
| `models.md`        | Eloquent in Laravel 13 — attributes over properties, casts, enums, and where domain logic goes      |
| `testing.md`       | Pest conventions, factories, and what runs against a real engine                                    |
| `auth/<choice>.md` | The authentication recipe for the chosen scheme                                                     |

## Queued Work

Laravel's queue runs `php artisan queue:work` **over the same codebase** — the job class the API dispatches is the job class the worker executes.

- The default is Laravel's own queue. Jobs live in `app/Jobs/`, and a worker is a second process running the same image with a different command. The `workers/` layer is not adopted alongside it.
- Job family isolation is still required: one queue per family (`queue:work --queue=exports`), one worker process per queue, so a backlog in one never starves another.
- Queued notifications are the common case and need no job class — subclass the framework notification and add the interface (`class VerifyEmailNotification extends VerifyEmail implements ShouldQueue`), then point the model's `sendEmailVerificationNotification()` at it.
- Adopting a `workers/` module instead is a decision record with a stated trigger — a language boundary, or a worker fleet that must scale and deploy independently of the API.

## Approved Libraries

- Laravel 13, Eloquent, Laravel Sanctum.
- Pest 5 + `pestphp/pest-plugin-laravel`; Pint.
- `laravel/pao` — reformats test and analysis output when an agent is running it.
- `laravel/tinker`, `laravel/pail` (development only).

## Avoid By Default

Permitted by the rules, rejected here:

- Closure routes in `routes/*.php`. They cannot be serialized, so a single one disables `route:cache` for the whole application; point every route at a controller action.
- `env()` anywhere outside `config/` — it silently returns null under `config:cache`.
- A repository layer wrapping Eloquent, and DTO classes mirroring models that no boundary requires.
- Editing a migration that has already run in a deployed environment (the forward-only Universal Rule; `models.md`, Migrations).
- Testing against SQLite while production runs another engine — see `testing.md`.
- `parent::toArray()` in a Resource (`http-layer.md`, API Resources).
- OAuth2 as an authorization server (Passport) — a project that must issue third-party credentials adopts the Identity layer (`stacks/identity/keycloak.md`) rather than growing one here.
