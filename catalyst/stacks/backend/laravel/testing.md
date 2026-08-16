# Laravel — Testing

**Layer:** Backend
**Tool:** Pest 5 · `pestphp/pest-plugin-laravel`

How this module tests. Read this when adding tests, or when deciding what level a piece of behavior should be tested at. The universal quality rules — what to assert, when doubles are allowed, proving a test can fail — live in `conventions/testing.md`; this document binds them to Laravel.

## Shape

Three layers, tested differently:

| Layer          | Contents                                                                                     | Tested by                                       |
| -------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Domain         | Plain PHP with the rules: model methods with branches, policies, value objects, calculations | Unit tests (`tests/Unit`) — no framework, no DB |
| Application    | Controllers, FormRequests, actions, resolvers — load → delegate → persist → respond          | Feature tests over real HTTP                    |
| Infrastructure | Eloquent wiring, mailers, queue adapters                                                     | Through feature tests, never directly           |

Feature tests drive the HTTP surface and are the primary coverage — a Laravel endpoint is mostly framework wiring, and the route, middleware, FormRequest, and Resource are part of the behavior under test, so act through `postJson()`/`getJson()`, never by calling a controller or service directly. A unit test that mocks Eloquent tests the mock.

Unit tests earn their place for logic that stands on its own: a domain method with branches, a calculation, a policy, a value object. `changeEmail()` returning false for an unchanged address is a unit test; "an admin can update another user's email" is a feature test. A rule stuck inside a controller or an I/O-bound service is not tested where it lies — it moves into the domain layer first, then gets its unit test.

`tests/Unit` files are plain Pest — they do not boot the framework. A file may opt into the base `TestCase` (`uses(TestCase::class)`) when the unit under test is framework-coupled, e.g. an Eloquent cast that resolves through the connection; that stays the documented exception, still without `RefreshDatabase`.

`tests/Pest.php` binds the base case and the database refresh once:

```php
uses(TestCase::class, RefreshDatabase::class)->in('Feature');
```

Applied to the directory, not repeated per file.

## Conventions

- **`test()`, not `it()`** — one form throughout, so the suite reads consistently. A deliberate deviation from Khorikov's naming examples; consistency wins over matching the book.
- **Descriptions are sentences about behavior**, lowercase, present tense, subject first: `test('admins can list users newest first', ...)`, `test('a password change fails with the wrong current password', ...)`. The failure output is then a readable statement of what broke.
- **Factories, never seeders** (`models.md`), with named states: `User::factory()->admin()->create()`.
- **Assert the contract, not the implementation.** `assertJsonPath('data.role', 'admin')` pins the shape a client depends on; counting queries does not.

## Test doubles

Fakes follow the managed/unmanaged rule (`conventions/testing.md`) — mail leaving the system is observable behavior, your own database is not:

| Target                                              | Allowed?                 | Rule                                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mail::fake()` / `Notification::fake()`             | Yes                      | SMTP is unmanaged. Assert **both directions** — `assertSentTo(...)` where mail is expected, `assertNothingSent()` where it is not; the second catches the regression nobody was looking for. |
| `Http::fake()`                                      | Yes                      | Third-party APIs are unmanaged; assert the outgoing call with `Http::assertSent()`.                                                                                                          |
| `Queue::fake()` / `Event::fake()` / `Bus::fake()`   | Not for internal work    | Internal jobs and events are implementation details — run them sync and assert the outcome. Fake only when the dispatch itself is a contract another system consumes.                        |
| `Storage::fake()`                                   | Own storage: prefer real | Your storage is managed; a real local disk beats the fake.                                                                                                                                   |
| Mocking Eloquent, repositories, in-process services | Never                    | The database is managed and in-process collaborators are used for real.                                                                                                                      |
| `travelTo()` / `Carbon::setTestNow()`               | Feature tests only       | Domain code takes time as a parameter and should never need it.                                                                                                                              |

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

**Tests run against the same engine as production** — the Persistence module's choice, not a substitute. This is a Universal Rule (Testing), and Laravel makes breaking it unusually tempting: `phpunit.xml` ships pointing at SQLite `:memory:`.

What it hides: column types that differ, `ALTER` behavior SQLite silently no-ops, enum and JSON handling, transaction and locking semantics, `ONLY_FULL_GROUP_BY`, collation and case-sensitivity, and any raw SQL at all.

So point the test connection at a real instance of the project's engine, on its own database:

- Locally, a container from the Deployment module — the same image production runs.
- In CI, a service container. `RefreshDatabase` wraps each test in a transaction and rolls back, so a real engine costs setup time, not per-test time.

If a project decides the tradeoff is worth taking anyway, that is a decision record naming what it accepts, not a default inherited from the framework skeleton.

## Running

- `php artisan test` (or `vendor/bin/pest`), with `--filter` while iterating.
- `composer test:coverage` — terminal summary; `composer test:coverage-html` additionally writes the browsable per-class report into `reports/coverage-backend/` (gitignored) and opens it in the browser. Both need the Xdebug extension.
- `laravel/pao` reformats the output when an agent is running the suite — failures come back as something readable rather than a wall of stack frames.
- The full suite is green before a merge; a failing test is never left for later without saying so.
- **Mutation audit**: Pest's built-in mutation testing (`pest --mutate`) runs periodically per the project runbook (`operations.md`) — every surviving mutant is a change no test noticed; fix the test or record why the mutant is acceptable. A measurement, never a CI gate.
- `--parallel` stays unprovisioned until suite duration demands it (per-process databases are the cost; the runbook notes what provisioning would take).
