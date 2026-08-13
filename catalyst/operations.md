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

First audit (2026-08-13): 60.69% baseline → 70.61% (262 mutations, 77 surviving). Second audit (2026-08-13), re-reading that triage with the intent to kill rather than to accept: **82.06%** (262 mutations, 47 surviving). Thirty mutants fell to twenty tests, and two of the survivors turned out to be worse than missing assertions — see below.

What the second pass found, beyond the rule gaps the first one had waved through as residue:

- **Nothing asserted an admin-set password takes effect**, on either transport — the `password` key could be dropped from the shared action's fill allowlist unnoticed.
- **Two session tests could not fail.** A test request carries no session cookie, so `session()->getId()` differs before and after any request whatever the controller does. Logout now asserts the observable effects (flushed data, reissued CSRF token); the login one is gone, its rotation being `SessionGuard::updateSession()`'s rather than the controller's. Recorded in `features/001_session-auth.md`.
- **GraphQL asserted only `extensions.status`**, so one rule firing masked every other rule's absence; the rejections are keyed by field now. Half the mirrored validator was also unreachable because the shared test document omitted the password arguments.
- **`Rules\Password::defaults()` was deletable on all four surfaces** — create, profile, register, reset. The 8-character minimum had never been asserted anywhere.

Accepted surviving mutants — recheck when touching the code they live in:

- **Events with no listeners** — removing `event(PasswordReset|Verified|Lockout)` is unobservable because nothing consumes them yet; the day a listener lands, its tests kill these.
- **Rule-list residue** (the largest group, ~15): `'sometimes'` on a field with no `required` beside it — Laravel skips non-implicit rules on an absent attribute anyway, so the mutant is behaviorally identical; `'string'` on a field whose format rule already rejects non-strings (`validateEmail` does); `'string'` on the GraphQL validator's `name`, unreachable because the schema types the argument `String`; and `'email'` on `LoginRequest`, where a malformed address fails the credential check into the same 422.
- **Password-broker message copy** (`PasswordResetLinkController` rules and both `!=` → `!==` on the status strings): every path already answers 422 keyed `email`; killing these would mean pinning broker message text, which is copy, not contract.
- **Throttle message copy and key residue** — `minutes` and its `ceil` are never rendered (no `lang/` is published and the framework's `auth.throttle` interpolates only `:seconds`); the `'|'` separator and the concat order leave the key unique per (email, IP) pair either way. The parts that _are_ contractual — the threshold of 5, the seconds in the message, the counter clearing on success, and scoping to both email and client address — are pinned now.
- **`remember_token` rotation** (`Str::random(60)` length and the array item on reset) — a deliberate hold: the `remember` flow is a recorded feature-doc gap, and pinning half of it here would document behavior the contract does not yet claim.
- **Session regeneration in the controllers** (`AuthenticatedSessionController::store`, `RegisteredUserController::store`) — `Auth::login()` already calls `$this->session->regenerate(true)`, so removing the explicit call changes nothing observable. Verified by hand, not assumed.
- **Defensive code unreachable through routes**: `UserRequest::authorize()`'s `&&` (route middleware guarantees a user), `ResourcePayload`'s JSON depth and assoc flags (Lighthouse's default resolver reads arrays and objects alike), `array_intersect_key` unwraps in both `UpdateUser`s (inputs are pre-filtered by both transports' validators).

Frontend mutation audit (ADR 009; `stryker.config.json`, same cadence and triage rule as the backend's). Scope is the data layer — `web/utils`, `web/services`, `web/stores`, `web/composables` — plus `web/plugins`, `web/regle-config.ts`, and `web/i18n/i18n.config.ts`, which joined once they had tests. Components, pages, layouts, and middleware are out because most components are still untested; every mutant in the rest would report as noise rather than signal. `.vue` files rejoin the same way these did — when enough of them are tested that the report reads as signal. The untested composables stay in scope on purpose: Stryker separates `NoCoverage` from `Survived` and prints a covered-code score beside the total, which is the honest analogue of the backend's `--covered-only` without a hand-maintained exclusion list that rots.

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

Second audit on `master` (2026-08-13), after the app-shell work below brought `web/plugins`, `web/regle-config.ts` and `web/i18n/i18n.config.ts` into scope: **94.22%** total, **97.22%** on covered code (519 mutants, 14 surviving, 16 uncovered). `i18n.config.ts` kills all 31 of its own. The audit found one real gap the Vuetify variant had already closed — `newPasswordRules` pinned the confirmation field's labelled message but not the password field's, leaving its label key deletable; the ported case kills it. Newly accepted survivors, on top of the categories above:

First audit on `variant/vuetify` (2026-08-13, run straight after master's testing work merged in): 89.53% → **92.09%** total, 95.06% → **97.78%** on covered code (443 mutants, 9 surviving; `services`, `services/queries` and `stores` at 100%). Every remaining survivor is one of master's accepted categories above. Two were killed rather than accepted:

- **The root-path alias in `authRedirectLogic`** — three mutants (the condition, the `'/'` literal, the whole block) survived because this branch redirects both arms to `/home`: a signed-out user hitting `/` lands there as a protected page under default-deny, so deleting the alias outright changed nothing observable. Master's spec catches it for free, since its default-deny goes to `/login` instead. Killed by asserting `/` while **signed in**, the one case the alias alone explains.
- **`newPasswordRules`'s `common.fields.password` label key** — the confirmation field's labeled message was pinned, the password field's was not. Killed by asserting the message names its field, symmetrically with the existing confirmation case.

Coverage at the same point: 30.15% statements / 32.73% lines overall, with `utils`, `services`, `services/queries`, `stores`, `types`, `middleware` and `i18n` all at 100% lines and `plugins/vuetify.ts` at 100%. The overall number sits below master's because this branch carries far more component code — the auth dialogs, the shared dialog bases, and the Vuetify pages are ~470 uncovered lines, and component tests are deferred on both branches (`decisions/008`).

Second audit on `variant/vuetify` (2026-08-13), after the app-shell work below brought `web/plugins` and `web/regle-config.ts` into scope: **92.98%** total, **97.11%** on covered code (470 mutants, 13 surviving, 20 uncovered). The total rose and the covered score dipped by the same event — new files arrived carrying three accepted survivors of their own. Re-run after master merged in and `i18n.config.ts` joined the globs: **94.22%** total, **97.33%** on covered code (502 mutants, 13 surviving, 16 uncovered) — level with master, and every survivor is an accepted category above. The audit paid for itself on `regle-config.ts`: the bare `email` and `sameAs` messages had no assertion anywhere, so either entry could be deleted and every form would silently fall back to the library's hardcoded English. Newly accepted survivors, on top of the categories above:

- **`auth-loader`'s `catch` block** — deleting `resetUser()` changes nothing: the store is always empty when the plugin boots, so the reset is defensive against a state the app cannot be in. Killing it would mean seeding a store the app never seeds.
- **`useCookieConsent`'s `maxAge` arithmetic** (two mutants) — a cookie's lifetime is not readable back through `document.cookie`, so no test at this layer can observe a year versus an hour. The browser enforces it.
- **`'declined'` → `''`** — both values mean "decided, and not consented" to every reader of the composable, which is the only thing that reads the cookie. Killable the day something else reads the stored string.

### The app shell, plugins and shared components — what is tested and what is not

Recorded because the alternative is invisible: a file at 0% looks the same whether the omission was deliberate or forgotten. The rule applied is `stacks/frontend/nuxt/testing.md` — logic gets a test, presentation is proven by the live browser walk (`decisions/008`).

| File                                            | Lines | Decision                                                                                                                                                                                                                                        |
| ----------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/auth-loader.ts`                        | 100%  | **Tested.** Load-bearing session restore; a failure means a returning user appears signed out on refresh.                                                                                                                                       |
| `app.vue`                                       | 87.5% | **Tested.** The `isLoggedIn` watcher is the only redirect path for a session change with no navigation — logout is a navbar button that never leaves the page, and an expired session resets the store mid-read. The shell around it is markup. |
| `composables/useCookieConsent.ts`               | 100%  | **Tested.** Cookie-backed persistence with two computeds and two actions.                                                                                                                                                                       |
| `composables/useExternalErrors.ts`              | 100%  | **Tested.** Writing the test its own comment implied found the bug that it shared the source object instead of copying it.                                                                                                                      |
| `composables/useValidationErrors.ts`            | 100%  | **Tested.** Including the empty map it must yield before anything has failed, which is what a form binds to on first render.                                                                                                                    |
| `i18n/i18n.config.ts`                           | 100%  | **Tested.** The three-branch Slavic plural rule, and the teens exception it exists for.                                                                                                                                                         |
| `regle-config.ts`                               | 100%  | **Tested.** The message catalog every form's validation text comes from.                                                                                                                                                                        |
| `components/_shared/CookieConsentBanner.vue`    | 100%  | **Tested.** Branching render state plus its own persistence — the case `testing.md` names as earning a mounted test.                                                                                                                            |
| `components/_shared/LocaleSwitcher.vue`         | 100%  | **Tested.** It calls `setLocale` specifically to persist the choice; asserting the rendered language would not catch losing it. On this branch it is a Vuetify menu, so the spec opens it before asserting.                                      |
| `layouts/Default.vue`                           | 72%   | **Tested.** Decides what a guest, a user and an admin each see, and owns logout. The admin entries are a convenience, not the control — the API authorizes those pages itself — but showing them advertises a door the user cannot open. The untested remainder is the dialog plumbing and the theme toggle. |
| `components/_shared/TheFooter.vue`              | 100%  | **No test of its own, deliberately.** Presentational; `testing.md` names it as the counter-example. Its 100% is incidental — the layout spec renders it.                                                                                        |
| `error.vue`                                     | 7%    | **No test, deliberately.** A status-code ternary and a `JSON.stringify`; a test would pin i18n key wiring, not behavior. Live browser walk. (Master's is eight lines and even clearer.)                                                          |
| `plugins/vuetify.ts`                            | 100%  | **Tested.** Theme, the SVG icon set, and the Vue I18n locale adapter — the adapter in particular fails invisibly until a Vuetify-owned string renders.                                                                                          |
| `components/users/*Dialog.vue`                  | ~35%  | **No tests yet.** Partially covered incidentally by the layout spec, which renders them. The auth dialogs are this branch's equivalent of master's auth pages and stay on the browser walk for now.                                              |
| `components/_shared/` dialog bases, `UserCard`, `UsersTable` | 0% | **No tests yet.** The largest remaining block on this branch (~230 lines), and the obvious next target.                                                                                                                        |
| `plugins/vue-toastification.ts`                 | 50%   | **No test, deliberately.** Three lines of third-party registration with no branch — a test could only assert `use()` was called, restating the file.                                                                                            |
| `plugins/hide-devtools-webcomponents.client.ts` | 12.5% | **No test, deliberately.** Dev-only DOM housekeeping guarded by `import.meta.dev`; it never runs in production or under test.                                                                                                                   |
| `pages/**`                                      | 0%    | **No tests, deliberately.** Pages stay on the live browser walk per `decisions/008`; the logic they used to hold has been extracted into the layers above.                                                                                      |

One observation worth keeping: `CookieConsentBanner`'s `isMounted` guard is **not observable in tests** — removing it breaks nothing, because `ssr: false` means there is no hydration pass for it to protect against. It is a flash guard for the first client frame, and no assertion at this level can see it.

Coverage after this work: on `master` **54.79% statements / 54.30% lines** (from 43.52% / 43.71%), what remains being almost entirely `pages/`; on `variant/vuetify` **46.13% / 47.35%** (from 33.64% / 36.21%). The branches differ because this one carries far more component code — the auth dialogs, the shared dialog bases, `UserCard` and `UsersTable` — where master has plain pages.

### Quirks

- The SPA and API must run on the exact origins in `SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` (`localhost:3000`/`3001` + `localhost:8000`) or auth silently fails on cookies/CORS.

## CI

GitHub Actions (`.github/workflows/ci.yml`), on push to `master`/`variant/**` and on PRs. Two jobs: frontend (oxlint, oxfmt check, typecheck, vitest with coverage — Node 24 + pnpm) and backend (pint check + Pest with coverage against a `mysql:8` service container whose `MYSQL_DATABASE` is `vanguard_testing`; job-level `DB_*` env vars override the phpunit/.env values). Coverage is printed, never gated (ADR 008); CI's driver is PCOV via `setup-php`, while local runs use Xdebug. No deploy step — deployment remains an honest gap (ADR 001).
