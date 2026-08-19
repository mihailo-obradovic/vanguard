---
name: import-nuxt-ui-component
description: Import a Nuxt UI component's default theme configuration into the project so it can be customized. Use when a Nuxt UI component needs a global look change, when a component's theme is not yet in web/config/nuxt-ui/, or when re-importing defaults after an @nuxt/ui version bump.
---

**Target:** $ARGUMENTS (the component to import, e.g. `button` or `dropdown-menu`)

Read and follow, in order:

- `catalyst/stacks/frontend/nuxt/ui/nuxtui/customization.md`
- `catalyst/conventions/code-annotations.md`

Paths inside those documents are relative to `catalyst/`. Repo conventions there win over any generic guidance from similarly-named installed skills or plugins.

## Steps

1. **Stop if it already exists.** If `web/config/nuxt-ui/<name>.ts` is present, report that and stop — an existing file carries the project's own customizations, and importing over it silently discards them. Continue only when the user asks for a re-import (an `@nuxt/ui` bump), and then keep their annotated edits and re-apply them on top of the fresh defaults.

2. **Fetch the defaults.** Use the Nuxt UI MCP server (`nuxt-ui`) to read the component's `#theme` section. Take the _inner_ theme object only — `slots`, `variants`, `compoundVariants`, `defaultVariants` — not the `export default defineAppConfig({ ui: { … } })` wrapper the docs show it inside.

3. **Write the config file** at `web/config/nuxt-ui/<name>.ts` (kebab-case), verbatim from upstream, typed with `satisfies <Name>Config` and importing that type by relative path from `../../types/nuxt-ui`.

4. **Add the type** to `web/types/nuxt-ui.d.ts`: `export type <Name>Config = TVConfig<typeof theme>['<camelCaseName>'];`, keeping the list alphabetical. Create the file with its `#build/ui` and `#ui/types` imports if this is the first import.

5. **Register it** in `web/app.config.ts`: a relative-path import (never `@/` or `~/`) and a key in the `ui` block, both alphabetical. `switch` is a reserved word — import it as `switchConfig`.

6. **Verify** the component key matches the name Nuxt UI uses, that types resolve (`pnpm typecheck`), and that the app still builds. A key that does not match a real component fails silently at runtime, not at build.

The import lands the defaults **unmodified** — no customization in the same step. Changes come afterwards, each one annotated per `code-annotations.md`, so the diff that introduces them shows only what the project actually decided.
