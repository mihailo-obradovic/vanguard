# Tier: Language — TypeScript/JavaScript

**Tier:** Language — TypeScript/JavaScript

Shared language-level conventions and performance rules for every stack that ships TypeScript or JavaScript — frontend or backend, framework-agnostic. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `_lang/typescript`.

Nothing here restates a Universal Rule or a framework rule: framework-specific guidance lives with the module that requires this tier (e.g. React conventions in `../../frontend/_react/`, Next.js conventions in the `nextjs` module).

## Documents

| Document | What it holds | Load |
| --- | --- | --- |
| `typescript-types.md` | Where types live, `.d.ts` vs `.ts`, `interface` vs `type`, `import type` discipline | When defining or organizing types |
| `toolchain.md` | oxlint + oxfmt: config ownership, plugin rules, house format style, scripts | When setting up or changing lint/format tooling, or wiring editor/CI checks |
| `performance.md` | Router over `rules/` — 24 language-level performance rules | When optimizing, or reviewing for performance |
| `rules/*.md` | One rule per file: rationale + incorrect/correct examples | Per rule, via `performance.md` — never wholesale |

The annotation convention for deliberate deviations, footguns, and to-dos is not language-level — it binds every project: [`conventions/code-annotations.md`](../../../conventions/code-annotations.md).

## Node Version

The Node major is pinned at the repository root: `mise.toml` holds it (`[tools]` / `node = "<major>"`), and `package.json` mirrors it as `"engines": { "node": ">=<major>" }` once one exists, so the version manager and CI read the same pin. A new project defaults to the latest LTS — the scaffolder writes `mise.toml` at spawn with the active LTS major and never touches it again; the pin is the project's own from that moment. Keep it the only pin file: mise stopped reading idiomatic version files (`.nvmrc`, `.node-version`) by default in 2025.10.0, so a second pin next to `mise.toml` is not a fallback but a divergence waiting silently for an nvm user — a repo migrating from `.nvmrc` deletes it in the same change that adds `mise.toml`. Bumping the pin is a deliberate act, not routine maintenance: a new major is promoted to LTS each October, and an update that drops a supported runtime belongs to the decision record that owns the choice (the maintenance module's rule, when adopted). Never float the pin (`lts/*`, `latest`) — a pin that moves on its own is not a pin.
