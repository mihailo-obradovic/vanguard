# Toolchain: Lint & Format — oxlint + oxfmt

**Tier:** Language — TypeScript/JavaScript

Every TypeScript/JavaScript stack lints with **oxlint** and formats with **oxfmt** — the OXC toolchain, one Rust binary each, no ESLint/Prettier config sprawl. Format with `oxfmt`; do not hand-format. oxlint is stable (1.x); oxfmt is beta but 100% Prettier-conformant on JS/TS and formats everything the stacks ship (JS/TS/JSX, Vue SFCs, JSON, YAML, CSS, Markdown), which is why its options are pinned explicitly rather than left to drifting upstream defaults.

Both configs live at the repository root and are **the project's own from spawn onward** — the scaffolder writes them once (like `.editorconfig`) and no upgrade ever regenerates them, because a lint config accretes project-specific rules from day one.

## `.oxlintrc.json`

- **An explicit `plugins` array replaces oxlint's default set** (`eslint`, `oxc`, `typescript`, `unicorn`) — it does not extend it. Never trim the list without knowing this; dropping `eslint` silently disables the core ESLint rules. The scaffolder assembles the list from the adopted stack: the base plugins plus `react`/`nextjs` (or the Vue-side equivalents) only when those modules travel.
- `categories.correctness = "error"` is the floor — definitely-wrong code fails the lint. Stricter categories (`suspicious`, `pedantic`, `perf`) are the project's own opt-in, rule by rule or category by category.
- Type-aware rules (via `oxlint-tsgolint`, stable since mid-2026) are **opt-in, not default**: they need the tsgolint sidecar and a real type-check pass, so adopt them deliberately when the project wants `typescript-eslint`-grade analysis — not as a reflex.

## `.oxfmtrc.json`

House style, set explicitly on purpose while oxfmt is beta — an option named here cannot shift under the project when an upstream default moves:

- `singleQuote: true`, `semi: true`, `trailingComma: "none"`, `printWidth: 80`, `tabWidth: 2`
- CSS at `tabWidth: 4` via an override — in agreement with the `.editorconfig` CSS section, as [`conventions/editor-setup.md`](../../../conventions/editor-setup.md) requires.

oxfmt reads `.editorconfig` only for options the config file leaves unset, and only the nearest one — the full mapping and precedence live in `conventions/editor-setup.md`. Since the fields above are explicit, the formatter's behavior never depends on it.

## Scripts

`package.json` carries the four verbs so humans, agents, and CI run the same thing: `lint` (`oxlint`), `lint:fix` (`oxlint --fix`), `format` (`oxfmt`), `format:check` (`oxfmt --check`).

ESLint and Prettier are never added: oxlint owns linting, oxfmt owns formatting.
