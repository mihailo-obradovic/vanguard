# Operations Runbook

Per `references/operations-runbook.md`: one section per stateful component — **Operate** / **Recovery** / **Quirks**. Commands and traps only; rules live in `architecture.md` and the feature docs.

## MySQL

Host-local server (no Docker/Sail), database `vanguard` at `127.0.0.1:3306`, credentials in `.env`. Holds application tables plus sessions, cache, and the (currently idle) jobs queue.

### Operate

```bash
php artisan db:show                # connection + table overview
php artisan migrate:status         # which migrations have run
php artisan tinker                 # poke at data
mysql -u <DB_USERNAME> -p vanguard # interactive client
```

One-time test-database provisioning (as MySQL root; `RefreshDatabase` migrates it on each run):

```bash
sudo mariadb -e "CREATE DATABASE IF NOT EXISTS vanguard_testing; GRANT ALL PRIVILEGES ON vanguard_testing.* TO '<DB_USERNAME>'@'localhost'; FLUSH PRIVILEGES;"
```

### Recovery

No backup routine exists — dev-only data so far; a restore drill has never been performed. Recreate from scratch with `php artisan migrate:fresh --seed` (seeder creates `test@example.com` admin). **Before any production use, a dump/restore routine must be added here and rehearsed.**

### Quirks

- Tests run on the separate `vanguard_testing` database on this same server (same engine, per the Laravel testing module): `phpunit.xml` pins `DB_CONNECTION`/`DB_DATABASE`; host and credentials are inherited from `.env` (no `.env.testing` exists — creating one would silently take over the test env, since `APP_ENV=testing` prefers it). `php artisan test --parallel` would need databases `vanguard_testing_1..n` — not provisioned.
- Sessions live in the `sessions` table (`SESSION_DRIVER=database`): truncating it logs everyone out; deleting a user leaves orphaned session rows (no FK).

## Queue

`QUEUE_CONNECTION=sync` in the local `.env` — queued notifications (verification + reset mail) execute inline in the request. The `jobs` table and the `queue:listen` process in `composer run dev` are ready for the `database` driver but idle under `sync`.

### Operate

```bash
php artisan queue:listen --tries=1   # only meaningful with QUEUE_CONNECTION=database
php artisan queue:failed             # inspect failures (database driver)
```

### Recovery

Under `sync` there is nothing to recover — a mail failure surfaces as a request error. Under `database`, failed jobs land in `failed_jobs`; retry with `php artisan queue:retry all`. Never drilled.

### Quirks

- Switching to `database` without running a worker silently strands all auth mail in the `jobs` table.

## Mail

Mailtrap sandbox SMTP (`sandbox.smtp.mailtrap.io:2525`, creds in `.env`) — all mail is captured, nothing reaches real inboxes.

### Operate

Check the Mailtrap inbox for verification/reset mails; `php artisan pail` (part of `composer run dev`) tails mail-send log entries.

### Quirks

- `MAIL_FROM_ADDRESS` is still `hello@example.com`.

## Dev stack

### Operate

```bash
composer run dev    # serve (localhost:8000) + queue:listen + pail + pnpm run dev
php artisan serve   # API alone
pnpm dev            # SPA alone (localhost:3000)
php artisan test && pnpm test   # both suites
composer test:coverage          # backend coverage (sets XDEBUG_MODE=coverage; needs the Xdebug extension)
pnpm test:coverage              # frontend coverage (text + html + lcov into coverage/, gitignored)
XDEBUG_MODE=coverage vendor/bin/pest --mutate --everything --covered-only   # backend mutation audit (below)
pnpm test:mutation              # frontend mutation audit (below)
```

Mutation audit (ADR 009; run after a test-writing push, not on a schedule): the command above mutates `app/` (Pest's built-in mutation testing; `--everything` because classes carry no `covers()` annotations, `--covered-only` to skip mutations no test executes) and reruns the covering tests per mutant. **Do not add `--parallel`** — mutant processes share the `vanguard_testing` database and would trample each other. Every listed _untested_ mutation is a change no test noticed — fix the test it exposes or record here why the mutant is acceptable. Score is a measurement, never a gate.

First audit (2026-08-13): 60.69% baseline → **70.61%** after the survivor-driven test fixes (262 mutations, 77 surviving, all triaged below). Accepted surviving mutants — recheck when touching the code they live in:

- **Events with no listeners** — removing `event(PasswordReset|Verified|Lockout)` is unobservable because nothing consumes them yet; the day a listener lands, its tests kill these.
- **Throttle-key composition and lockout copy** (`LoginRequest::throttleKey` concat order, the `seconds`/`minutes` message params, `ceil` variants) — per-email-vs-IP lockout scoping and message wording are not contractual; the threshold itself (5) and the throttle response are pinned.
- **`remember_token` rotation details** (`Str::random(60)` length, the array item on reset) — the `remember` flow is a recorded feature-doc gap; length is trivia.
- **Rule-list residue**: `'string'` on fields whose format rule subsumes it, `'sometimes'` items whose removal only changes empty-body no-ops, and the mirrored GraphQL validator's remaining single-rule removals — the meaningful rules (required sets, unique, confirmed, lowercase, max, enum) are all covered.
- **Defensive code unreachable through routes**: `UserRequest::authorize()`'s `&&` (route middleware guarantees a user), `datetime` cast on `email_verified_at` (type trivia), `ResourcePayload`'s JSON flag integers, `!=` → `!==` on the password-broker status strings (equivalent for string constants), `array_intersect_key` unwrap in `UpdateUser` (inputs pre-filtered by both transports' validators).

Frontend mutation audit (ADR 009; `stryker.config.json`, same cadence and triage rule as the backend's). Scope is the data layer — `web/utils`, `web/services`, `web/stores`, `web/composables`. Components, pages, layouts, plugins, and middleware are out because nothing tests them yet; every mutant there would report as noise rather than signal. The untested composables stay in scope on purpose: Stryker separates `NoCoverage` from `Survived` and prints a covered-code score beside the total, which is the honest analogue of the backend's `--covered-only` without a hand-maintained exclusion list that rots.

Four config choices are load-bearing and easy to undo by accident:

- **`ignorePatterns` is only `!.nuxt`.** Stryker honors `.gitignore`, so nothing else needs listing — excluding the Laravel directories on top was measured and changed neither the score nor the wall clock (488K of copying). The negation is the whole point of the option here: because `.nuxt` is gitignored it is not copied into the sandbox, and the partial tree that `buildNuxt` regenerates there has no `tsconfig.app.json`, the root `tsconfig.json` references it, and every spec then dies in oxc with `TSCONFIG_ERROR`. Stryker reports that as a bare "No tests were found".
- **No `packageManager` key.** Setting it makes Stryker run `pnpm install` inside the sandbox, where `node_modules` is a symlink back to the real one — pnpm rewrites the real `node_modules/.modules.yaml` to point `virtualStoreDir` at the sandbox, and every later pnpm command in the project demands to purge `node_modules`. Never run pnpm with a working directory inside `.stryker-tmp` either; the recovery is `CI=true pnpm install --frozen-lockfile` from the project root.
- **`ignoreStatic: true`** — `web/mocks/setup.ts` swaps `globalThis.$fetch` at module scope, and a static mutant forces a full environment reload per mutant against that load-order-sensitive capture.
- **`vitest.related: false`** — related-file resolution across Nuxt's vite pipeline can silently fail to find the covering tests, which surfaces as a whole file reported `Survived`. Per-test coverage already selects the right specs.

`concurrency: 4` is a portable default, not a tuned one. Measured on 16 cores: 4 → 1m32, 8 → 1m20, 12 → 1m30. Raising it toward half the core count is worth a measurement on a given machine; Stryker's own default (`cores - 1`) is past the knee, because each worker boots its own Nuxt vite server. `disableTypeChecks` was measured at its default versus `false` — identical score, no time saved — so it stays untouched.

Anything that puts a second copy of this repository inside the working tree — a crashed Stryker sandbox, a `git worktree` under `.claude/worktrees/` — gets collected by vitest as if it belonged here, and every spec runs twice, once against the wrong tree. Both are excluded in `vitest.config.ts`; a sudden doubling of the test-file count is that failure, not a broken change.

First audit (2026-08-13): 84.38% baseline → **92.19%** total, and 90.00% → **97.64%** on covered code (448 mutants, 42 surviving, all triaged below; `services` and `stores` reach 100%). Stryker reports several mutants per line, so before writing a test against a survivor, read its `replacement` in `reports/mutation/frontend.json` — a guard's outer condition and its inner operand are separate mutants, and sabotaging the wrong one proves nothing. Accepted surviving mutants — recheck when touching the code they live in:

- **The `typeof x !== 'object'` operand** in `getValidationErrors` and `gqlFetcher`'s `toValidationBody` — reachable only for a truthy non-object, and every such value already yields `{}` through the string-array message filter below it. The guard is defense-in-depth the filter provides anyway.
- **`RedirectDecision.reason`** (all three strings) — written and never read anywhere in `web/`; diagnostic metadata, not behavior. The day something displays or logs it, its test kills these.
- **`.some` → `.every` on `guestOnlyPrefixes`** — the list holds one prefix, so the two are equivalent; a second prefix makes this killable and should arrive with the test that adds it. (Master only — this branch has no prefix list.)
- **`credentials: 'include'` in `fetcher`** — MSW intercepts below the point where credentials mode is observable, so no test at this layer can see it. The browser enforces it, and the session feature covers the effect.
- **The empty `default:` branch** in `handleApiError` — a Stryker artifact on a `break` with no behavior.
- **`sameAs(password, 'password')`'s second argument** — the field label inside the message, not a contract; same reasoning as the backend's lockout-copy mutants.
- **`parseResponse`'s `console.error` text** — `conventions/testing.md` prohibits asserting on logs.

First audit on `variant/vuetify` (2026-08-13, run straight after master's testing work merged in): 89.53% → **92.09%** total, 95.06% → **97.78%** on covered code (443 mutants, 9 surviving; `services`, `services/queries` and `stores` at 100%). Every remaining survivor is one of master's accepted categories above. Two were killed rather than accepted:

- **The root-path alias in `authRedirectLogic`** — three mutants (the condition, the `'/'` literal, the whole block) survived because this branch redirects both arms to `/home`: a signed-out user hitting `/` lands there as a protected page under default-deny, so deleting the alias outright changed nothing observable. Master's spec catches it for free, since its default-deny goes to `/login` instead. Killed by asserting `/` while **signed in**, the one case the alias alone explains.
- **`newPasswordRules`'s `common.fields.password` label key** — the confirmation field's labeled message was pinned, the password field's was not. Killed by asserting the message names its field, symmetrically with the existing confirmation case.

Coverage at the same point: 30.15% statements / 32.73% lines overall, with `utils`, `services`, `services/queries`, `stores`, `types`, `middleware` and `i18n` all at 100% lines and `plugins/vuetify.ts` at 100%. The overall number sits below master's because this branch carries far more component code — the auth dialogs, the shared dialog bases, and the Vuetify pages are ~470 uncovered lines, and component tests are deferred on both branches (`decisions/008`).

### Quirks

- The SPA and API must run on the exact origins in `SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` (`localhost:3000`/`3001` + `localhost:8000`) or auth silently fails on cookies/CORS.

## CI

GitHub Actions (`.github/workflows/ci.yml`), on push to `master`/`variant/**` and on PRs. Two jobs: frontend (oxlint, oxfmt check, typecheck, vitest with coverage — Node 24 + pnpm) and backend (pint check + Pest with coverage against a `mysql:8` service container whose `MYSQL_DATABASE` is `vanguard_testing`; job-level `DB_*` env vars override the phpunit/.env values). Coverage is printed, never gated (ADR 008); CI's driver is PCOV via `setup-php`, while local runs use Xdebug. No deploy step — deployment remains an honest gap (ADR 001).
