# Vanguard

## About this template

This is a starter template for small full-stack projects: a [Laravel](https://laravel.com) 13 API-only back end (PHP ^8.3) paired with a [Nuxt](https://nuxt.com) 4 single-page front end. All non-config front-end files live inside the `web` directory (`srcDir`), keeping the two halves cleanly separated. Server-side rendering is turned off by default (`ssr: false`).

Authentication uses [Laravel Sanctum](https://laravel.com/docs/13.x/sanctum)'s stateful cookie mode: session cookies with CSRF protection, JSON-only responses, no server-side redirects. The API wraps user payloads in Laravel API Resources (`{ "data": ... }` envelope) and the SPA validates every response with [Zod](https://zod.dev) schemas.

Front-end data access goes through [Pinia](https://pinia.vuejs.org) + [Pinia Colada](https://pinia-colada.esm.dev) in two layers: plain service functions (`web/services/*.api.ts`) and query/mutation composables (`web/services/queries/`), with centralized error handling. Forms validate client-side with [Regle](https://reglejs.dev); server 422s surface inline rather than as toasts.

Installed Nuxt modules: Fonts, Image, Test Utils, Pinia, Pinia Colada, VueUse. Dates are handled with `temporal-polyfill`, toasts with `vue-toastification`. A single global middleware (`web/middleware/auth.global.ts`) owns all auth routing; the `auth-loader` plugin rehydrates the session at boot. Shared components in `web/components/_shared` are auto-imported.

The `master` branch is CSS/component-framework-agnostic — global styles are plain CSS (`web/assets/styles/main.css`). It's meant to serve as a base for other branches, but it can also be used as a standalone template.

An opinionated [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter) setup is included for linting and formatting; VS Code users get the `oxc.oxc-vscode` extension recommendation. The project is [pnpm](https://pnpm.io/)-only (enforced by a `preinstall` hook); the Node version is pinned via [mise](https://mise.jdx.dev) (`mise.toml`, Node 24). Dependency updates are automated with Renovate.

Project rules and documentation for AI agents (and humans) live in the [`catalyst/`](catalyst/) bundle — feature contracts, decision records, the operations runbook, and per-stack conventions — entered through `CLAUDE.md`/`AGENTS.md` at the root.

## Branches

So far, the only prepared branch in addition to master is the [Vuetify](https://vuetifyjs.com) variant. It covers all the baseline functionalities present on `master` with interfaces built using ready Vuetify components. Some customization and commonly used components are included.

## Docs

- **[Laravel](https://laravel.com/docs/13.x)**
- **[Sanctum](https://laravel.com/docs/13.x/sanctum)**
- **[Pest](https://pestphp.com/docs)**
- **[Vue.js](https://vuejs.org/guide/introduction.html)**
- **[NuxtJS](https://nuxt.com/docs/getting-started/introduction)**
- **[Vite](https://vitejs.dev/guide/)**
- **[Pinia](https://pinia.vuejs.org/introduction.html)**
- **[Pinia Colada](https://pinia-colada.esm.dev)**
- **[Regle](https://reglejs.dev)**
- **[Zod](https://zod.dev)**
- **[Vitest](https://vitest.dev/guide/)**
- **[pnpm](https://pnpm.io/motivation)**
- **[TypeScript](https://www.typescriptlang.org/docs/)**

- **[oxlint](https://oxc.rs/docs/guide/usage/linter)**
- **[oxfmt](https://oxc.rs/docs/guide/usage/formatter)**

- **[Vuetify](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides)**

## Contributing

Explore available branches that are dedicated to specific CSS/component frameworks or create new ones using `master` as a base. Avoid committing directly existing branches unless they're in an early phase or you are the sole contributor.

## Setup

Requirements: PHP ^8.3 + Composer, Node 24 (`mise install`), pnpm, and a MySQL server.

### Back-end

```bash
# install dependencies
composer install

# create a copy of the .env file, then set your DB_* credentials in it
cp .env.example .env

# generate an app key
php artisan key:generate

# create the database named in DB_DATABASE, then run migrations
php artisan migrate --seed

# start dev server on `http://localhost:8000`
php artisan serve
```

Alternatively, `composer run setup` performs install → env copy → key → migrate → front-end install + build in one go (edit `.env` credentials when the copy exists), and `composer run dev` starts the API, queue listener, log tail, and Nuxt dev server together.

### Front-end

```bash
# install dependencies
pnpm i

# start dev server on `http://localhost:3000`
pnpm run dev

# build for production
pnpm run build

# locally preview production build
pnpm run preview
```

### Tests

The back-end suite (Pest) runs against a real MySQL database named `vanguard_testing` — create it once, reusing the credentials from `.env` (see `catalyst/operations.md` for the exact statement). The front-end suite is Vitest.

```bash
composer test   # back-end (Pest, MySQL)
pnpm test       # front-end (Vitest)
```

Other front-end scripts: `pnpm typecheck`, `pnpm lint` / `pnpm lint:fix`, `pnpm format` / `pnpm format:check`.
Back-end formatting is Pint: `composer format` / `composer format:check`.
