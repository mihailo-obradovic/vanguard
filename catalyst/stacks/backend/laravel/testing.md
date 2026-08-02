# Laravel — Testing

**Layer:** Backend
**Tool:** Pest 5 · `pestphp/pest-plugin-laravel`

How this module tests. Read this when adding tests, or when deciding what level a piece of behavior should be tested at.

## Shape

Feature tests drive the HTTP surface and are the primary coverage. A Laravel endpoint is mostly framework wiring — routing, middleware, validation, serialization, the database — and the Universal Rules already say that is exactly what integration tests are for. A unit test that mocks Eloquent tests the mock.

Unit tests earn their place for logic that stands on its own: a domain method with branches, a calculation, a value object. `changeEmail()` returning false for an unchanged address is a unit test; "an admin can update another user's email" is a feature test.

`tests/Pest.php` binds the base case and the database refresh once:

```php
uses(TestCase::class, RefreshDatabase::class)->in('Feature');
```

Applied to the directory, not repeated per file — a new feature test then cannot forget it.

## Conventions

- **`test()`, not `it()`** — one form throughout, so the suite reads consistently.
- **Descriptions are sentences about behavior**, lowercase, present tense, subject first: `test('admins can list users newest first', ...)`, `test('a password change fails with the wrong current password', ...)`. The failure output is then a readable statement of what broke.
- **Factories, never seeders** (`models.md`), with named states: `User::factory()->admin()->create()`.
- **Assert the contract, not the implementation.** `assertJsonPath('data.role', 'admin')` pins the shape a client depends on; counting queries does not.
- **`Notification::fake()` / `Queue::fake()`** for side effects, with an explicit assertion in both directions — `assertSentTo(...)` where mail is expected, `assertNothingSent()` where it is not. The second is the one that catches a regression nobody was looking for.

```php
test('users can authenticate', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertNoContent();
    $this->assertAuthenticatedAs($user);
});
```

## What to cover

Beyond the happy path, these are the ones that get skipped and then break:

- **Authorization from the other side.** For every endpoint a role can reach, a test that the wrong role gets 403 — and, where it matters, that an authenticated non-owner does too.
- **Fields the endpoint must not accept.** A self-service profile update that silently accepted `role` would pass every happy-path test. Assert the value is unchanged after sending it.
- **The auth seam's own edge cases**: rate limiting after the configured attempts, the unauthenticated response being 401 rather than a redirect, signed URLs expiring.
- **Validation failures**, via `assertJsonValidationErrors('field')` — the frontend renders those inline and depends on the field key.
- **Regression tests** for every bug fix: failing before the fix, passing after.

## The test database

**Tests run against the same engine as production** — the Persistence module's choice, not a substitute. This is a Universal Rule (Testing), and Laravel makes breaking it unusually tempting: `phpunit.xml` ships pointing at SQLite `:memory:`, it is faster, and it works right up until it does not.

What it hides: column types that differ, `ALTER` behavior SQLite silently no-ops, enum and JSON handling, transaction and locking semantics, `ONLY_FULL_GROUP_BY`, collation and case-sensitivity, and any raw SQL at all. Those are precisely the failures a test suite exists to catch before deploy.

So point the test connection at a real instance of the project's engine, on its own database:

- Locally, a container from the Deployment module — the same image production runs.
- In CI, a service container. `RefreshDatabase` wraps each test in a transaction and rolls back, so a real engine costs setup time, not per-test time.

If a project decides the tradeoff is worth taking anyway, that is a decision record naming what it accepts, not a default inherited from the framework skeleton.

## Running

- `php artisan test` (or `vendor/bin/pest`), with `--filter` while iterating.
- `laravel/pao` reformats the output when an agent is running the suite — failures come back as something readable rather than a wall of stack frames.
- The full suite is green before a merge; a failing test is never left for later without saying so.
