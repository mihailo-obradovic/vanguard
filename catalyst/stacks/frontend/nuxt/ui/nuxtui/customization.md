# Nuxt UI Customization

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Tailwind CSS 4 · Tailwind Variants

How this project changes what a Nuxt UI component looks like. Component APIs (props, slots, events) are the library's own documentation — reach for the Nuxt UI MCP server; this document owns only the shape the project keeps its overrides in.

## The layout

Three files, and a component's theme touches all three:

| Path                           | Holds                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `web/config/nuxt-ui/<name>.ts` | One component's theme object — `slots`, `variants`, `compoundVariants`, `defaultVariants` |
| `web/app.config.ts`            | The `ui` block: the colour aliases, and one key per imported component                    |
| `web/types/nuxt-ui.d.ts`       | One exported `TVConfig` type per component, so the config file is type-checked            |

A component's theme is only ever customized here. A one-off `:ui` prop at a call site is a local exception (see Avoid By Default) — the global config is the default home.

## Vendored defaults, not deltas

A config file holds the component's **complete upstream default theme**, then the project's edits on top — not only the lines that differ. Nuxt UI would merge a partial override natively, so this is a deliberate trade: every class the component resolves is greppable in the repo and a reviewer sees the whole surface a change lands on, at the cost of pinning that component to a snapshot of the version it was imported from.

The cost is real and has to be paid deliberately: **upstream theme changes do not reach a vendored component.** When `@nuxt/ui` takes a minor or major bump, re-import the components whose defaults moved and re-apply the project's edits on top — the annotations below are what makes that a mechanical diff rather than an archaeology exercise. A bump that skips this leaves the app on stale defaults silently.

**Tailwind class sorting is off inside `web/config/nuxt-ui/`**, and on everywhere else. Sorting rewrites a class string into canonical order, which is the right default for the project's own markup and destroys the property that makes vendoring work here: an imported config is only a diffable snapshot of upstream while its class strings are byte-identical to upstream's. The exemption is an `overrides` entry in `.oxfmtrc.json` — the config directory is the only place in the repo where unsorted classes are correct.

A component is imported when the project first renders it, not when it first needs a change — the config directory is meant to mirror the component surface in use. Importing is the `/import-nuxt-ui-component` skill's job; it also refuses to overwrite an existing config, so a re-import is a deliberate act.

## Never overwrite a default

The point of vendoring is that a reader can tell what the project changed and what it used to be, without fetching upstream. Every deviation is annotated, using the markers and the `Default:` / `Changes:` forms in [`code-annotations.md`](../../../../../conventions/code-annotations.md) — that document is the single source of truth for the shapes; this one only says they are mandatory here.

Three deviations cover nearly everything:

- **Adding classes to a slot** — turn the class string into an array and keep the upstream string as the first element, so the addition reads as an addition.
- **Changing a prop default** — the original goes on the same line as a `// * Default:` note.
- **Adding a variant** — mark it, since nothing upstream will explain why it exists.

An un-annotated line in a config file is read as an upstream default, so an unmarked edit is worse than no vendoring at all.

## Wiring rules

- **File names are kebab-case** (`dropdown-menu.ts`), the `app.config.ts` key is the component's camelCase name (`dropdownMenu`). They must match the key Nuxt UI itself uses, or the override silently does nothing.
- **`app.config.ts` imports by relative path**, never the `@/` or `~/` alias — the file is loaded before the alias map exists, and an aliased import there fails the build.
- `switch` is a reserved word: import it as `switchConfig` and register it as `switch: switchConfig`.
- Imports and keys stay alphabetical; the list is long and only stays reviewable if it is ordered.
- Every config file ends with `satisfies <Name>Config` against its type from `web/types/nuxt-ui.d.ts`. Without it a typo in a slot name is silently ignored at runtime.

## Colour comes from the aliases

Components take colour by semantic alias (`color="primary"`, `color="error"`), never a Tailwind palette name and never a hex value. The aliases are mapped once in `app.config.ts`'s `ui.colors`, over the ramps the project defines with `@theme` in its stylesheet — that mapping and the ramps behind it are the design system's ([`../../design-system.md`](../../design-system.md)), not this document's.

A component config that names a raw colour (`bg-purple-500`) is a missing alias, the same way a literal hex in a scoped style is a missing token.

## Avoid By Default

- **Using a component without importing its config.** Every Nuxt UI component the project renders has a config file, whether or not it is customized yet — the set of files is the inventory of what the project actually uses, and a component with nowhere to put an override invites a one-off `:ui` prop instead. Components with no theme section at all (`App`, `ColorModeButton`) are the exception: there is nothing to configure, and `ColorModeButton` takes `Button`'s theme.
- **A `:ui` prop where a global change belongs.** If the same override appears at a second call site, it was a theme change; move it. The prop is for the genuinely one-off case.
- **Deep selectors into Nuxt UI internals** (`:deep(.some-generated-class)`). Slot classes, variants, and the `class` prop are the supported surface; a deep override breaks on a patch bump.
- **Editing a config to match a design instead of fixing the token.** If `primary` is wrong everywhere, the alias or the ramp is wrong — not thirty component configs.
