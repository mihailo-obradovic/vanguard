# Procedure: Audit i18n

**Category:** i18n
**Tool:** @nuxtjs/i18n

Audit an area of the codebase for hardcoded user-facing text and message-catalog hygiene, then apply fixes: extract strings into the catalogs, backfill missing entries, group keys sensibly, and alphabetize.

**Authoritative rules:** [`catalog-hygiene.md`](catalog-hygiene.md).

**Target:** the directory or feature area given by the caller; if none is given, the files changed on the current branch.

## What to check

### 1. Hardcoded user-facing display text

Flag literal display strings that should be catalog keys:

- Template text nodes and interpolations that render words for users, including strings built in `<script setup>` and handed to the template (nav item lists, column headers, option labels).
- User-facing attributes: `aria-label`, `alt`, `title`, `placeholder`, `label`.
- Page metadata (`useHead` / `definePageMeta` titles and descriptions).
- Toast and notification calls, and confirmation prompts.
- User-facing thrown/returned messages (form validation messages, error helpers).
- Locale-sensitive formatting pinned to a hardcoded tag (`toLocaleString('en-US')`, a fixed `Intl` locale) — it belongs to the active locale.

**Not** flagged (keep literal): route paths and names, CSS class or token strings, test ids, `key` values, `console.*` / log output and developer-only error text, non-visible code identifiers, and text the backend already localizes and returns ready to display.

### 2. Placement / grouping

- Reusable, context-free phrases belong in the `common` namespace, defined once; feature copy belongs in its feature's namespace ([`catalog-hygiene.md`](catalog-hygiene.md) → _Placement_).
- Flag duplicates of the same phrase across namespaces and consolidate into `common`.

### 3. Parity

- Key parity and interpolation structural identity across all `<locales>` catalogs — [`catalog-hygiene.md`](catalog-hygiene.md) rules 1 and 4 — plus plural-branch counts matching each locale's plural system (rule 5).
- Report unused keys (defined in catalogs but referenced nowhere) so they can be removed — but only remove after confirming no dynamic key construction references them.

### 4. Ordering

- Key ordering follows [`catalog-hygiene.md`](catalog-hygiene.md) rule 2 (alphabetical, same order across locales).

## Fix protocol

1. Collect findings per file with line references (hardcoded strings, misplaced/duplicated keys, parity gaps, ordering issues).
2. Extract each literal to a key in the right namespace in **every** locale catalog, and wire the call site to the right translator — `$t` in templates, `useI18n()` in `<script setup>`, `useNuxtApp().$i18n` called inside the function in plain `.ts` ([`catalog-hygiene.md`](catalog-hygiene.md) → _Reaching the catalog outside a component_). Interpolated template literals become named parameters (`t('users.toasts.created', { name })`), never string concatenation. Where a translation had to be machine-produced, **mark the entry for human review** — Honest Inputs: never silently ship a guessed translation as if a human wrote it. If a translation is too ambiguous to attempt, add the primary-locale value, flag it, and skip inventing copy.
3. Update any test that asserted the English literal — assert against the catalog or a stubbed translator, not a copy of the string.
4. Run the project's catalog parity test and typecheck. Both must pass.

## Output

For each file: list issues with `file:line` references, then the fixes applied. Flag ambiguous cases (unclear register, uncertain translation, possibly-unused keys) for the user. End with a summary against the step-1 baseline: hardcoded strings found vs remaining after extraction (remaining must be zero or flagged), keys added/moved/removed, parity gaps closed, and items flagged for human review.
