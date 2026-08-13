# Decision: Adopt the i18n addon (@nuxtjs/i18n) with en / sr-Latn / sr-Cyrl

## Status

Accepted

## Type

infra

## Task Weight

Hard

## Context

Vanguard shipped every user-facing string as a hardcoded English literal. Catalyst's i18n addon existed only for the `nextjs` module (next-intl); the `nuxt` module had none, so adopting internationalization here meant authoring the Nuxt-side addon as well as wiring the app.

The trigger is the project's own purpose: Vanguard is the reference implementation for Catalyst's nuxt + laravel pairing and a testbed for the optimal setup across UI-library variants. An i18n story that works identically on the headless (`master`) and Vuetify (`variant/vuetify`) variants is part of that reference surface, and the addon's adoption criterion — user-facing in more than one language — is met by the locale set below.

## Decision

**Adopt `@nuxtjs/i18n` v10 with the locale set `en` (source), `sr-Latn`, and `sr-Cyrl`**, and author the Nuxt i18n addon documents (`stacks/frontend/nuxt/addons/i18n.md` plus its `i18n/` payload) that govern it.

The choices that were genuinely contested:

- **`strategy: 'no_prefix'` with a cookie, over the prefix strategies.** The app is a client-only SPA behind login (ADR 005) with no SEO surface, so locale-prefixed URLs buy nothing while costing `localePath()` on every link and an interaction with the global auth middleware. `detectBrowserLanguage` picks the first locale from the browser and persists the choice to a cookie, mirroring how the theme preference is already held.
- **One catalog file per locale, not per-namespace files.** Three locales against ~200 keys would mean 18 hand-registered files; namespaces as top-level keys inside three files keep parity reviewable and the config trivial. The split is available later if the catalogs outgrow a single file.
- **`sr-Cyrl` is transliterated from `sr-Latn`, not translated independently.** They are script variants of one language and the mapping is deterministic; authoring Serbian twice invites drift. The parity test checks the transliteration and holds the exemption list (brand names, email addresses) in one place.
- **Plain `sr` and `sr-RS` resolve to `sr-Latn`.** ICU treats bare `sr` as Cyrillic, but Latin is the dominant script on the web in the region this project targets, so the mapping is set explicitly rather than left to the default.

## Scope

Root `nuxt.config.ts` (module + `i18n` block), `web/i18n/` (config, catalogs, folder document), every `.vue` file carrying user-facing text, the plain-`.ts` helpers that produce user-facing messages (`getErrorMessage`, `parseResponse`, `newPasswordRules`, `formatDate`), their colocated specs, and `.vscode/`. On `variant/vuetify` it additionally covers `plugins/vuetify.ts` (the Vue I18n locale adapter) and the dialog/primitive components that variant owns.

No API shapes or behavior contracts change. Strings the backend returns already localized stay server-side and are displayed as received.

## Consequences

- Every user-facing string now has one home, and the addon's hard rule ("through the catalog from day one") applies to all new work — the `audit-i18n` skill enforces it.
- Serbian plurals need three `|` branches and a `pluralRules` entry; a two-branch pluralized key is silently wrong in Serbian, which the parity test catches.
- The two variants keep one shared catalog vocabulary: keys whose copy matches are defined once under the same name, so the catalogs do not fork per variant.
- Adopting SSR later reopens the strategy choice — prefixed routes, `useLocaleHead`, and hreflang only become worthwhile with a server.
- `formatDate` is locale-dependent now, so its output is no longer a fixed English string; tests assert per locale.

## Contracts Touched

- `project-summary.md` — Technical Stack (`frontend/addons` row + locale set), ADR index row.
- `stacks/frontend/nuxt/addons/i18n.md` and `addons/i18n/` (catalog hygiene, audit procedure) — the addon documents authored by this change.
- `architecture.md` — the nuxt module's addon list in the stack index.
- `web/CLAUDE.md` and `web/i18n/CLAUDE.md` — folder documents pointing at the catalog hygiene rules.
- `conventions/editor-setup.md` — the `lokalise.i18n-ally` recommendation this adoption activates.

## Open Questions

## Verification

Catalog parity test (`web/i18n/_tests/locales.spec.ts`: key parity, alphabetical ordering, interpolation parity, Latin→Cyrillic transliteration) and, since 2026-08-13, `web/i18n/_tests/i18n.config.spec.ts` — the Serbian plural rule across the one/few/other boundaries and the teens that are the exception it exists for, plus the `$vuetify` trees this branch mounts for the locale adapter. Both plus the existing Vitest suite, `vue-tsc`, and oxlint/oxfmt. Verified in the browser on both variants: switching locale updates page copy, toasts, validation messages, and formatted dates; the choice survives a reload via the cookie. On `variant/vuetify`, Vuetify's own strings switch through the Vue I18n adapter.
