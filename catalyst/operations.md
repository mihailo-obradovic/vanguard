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
```

### Quirks

- The SPA and API must run on the exact origins in `SANCTUM_STATEFUL_DOMAINS` / `FRONTEND_URL` (`localhost:3000`/`3001` + `localhost:8000`) or auth silently fails on cookies/CORS.

## CI

GitHub Actions (`.github/workflows/ci.yml`), on push to `master`/`variant/**` and on PRs. Two jobs: frontend (oxlint, oxfmt check, typecheck, vitest — Node 24 + pnpm) and backend (pint check + Pest against a `mysql:8` service container whose `MYSQL_DATABASE` is `vanguard_testing`; job-level `DB_*` env vars override the phpunit/.env values). No deploy step — deployment remains an honest gap (ADR 001).
