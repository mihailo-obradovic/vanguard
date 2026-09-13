# shadcn-vue Setup

How the registry, Tailwind, and the theme are wired, and the discipline that keeps vendored source reviewable.

## Dependencies

The CLI is run through `pnpm dlx`, never installed as a project dependency. Runtime support packages — `reka-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `@lucide/vue`, `tailwindcss`, `@tailwindcss/vite` — arrive because `init` and `add` need them, and are recorded in `architecture.md`'s approved-dependency table. A component that wants a package none of them provides is a Dependency Change like any other.

## `components.json`

Lives at the **repository root**, not in `web/`, because that is where `package.json` and `nuxt.config.ts` are. It is the CLI's contract: `style: new-york`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`, `css: web/assets/styles/main.css`, and the `@/components/ui` / `@/lib/utils` aliases. Changing a value here does not restyle anything already vendored — it only changes what the _next_ `add` writes. Restyling existing components means editing them.

## Tailwind 4 is a Vite plugin

There is no `tailwind.config.js` and no PostCSS step: `@tailwindcss/vite` is registered in `nuxt.config.ts`'s `vite.plugins`, and `web/assets/styles/main.css` does the rest with `@import 'tailwindcss'` plus an `@theme inline` block mapping the shadcn variables onto Tailwind colour names. A class that has no effect is usually a token that was never mapped in `@theme inline`, not a missing config.

## The theme

`main.css` holds the shadcn variable set as OKLCH values — the light face on `:root`, the dark face in `.dark` — carrying Dracula rather than the registry's neutral defaults. The palette is not derived here: `variant/nuxtui` already worked it out and measured it (its `decisions/014_ui_nuxtui-variant.md`), and all three variants paint the same product in the same colours, so that branch is the source. Deviations from the scaffold get `Default:` annotations like any other vendored code — including deviations from _that_ palette, of which there is currently one (dark `--muted-foreground`, a step lighter because shadcn pairs muted text with the muted fill and Nuxt UI does not).

**Two faces, switched by `@nuxtjs/color-mode`.** The module's synchronous head script puts `dark` on `<html>` from the stored preference before first paint — `.dark` selectors and the `dark:` variant both key off that class. `preference` is `'light'`, not the module's `'system'`: a first visit renders light, and the choice persists under the module's `nuxt-color-mode` localStorage key. `web/spa-loading-template.html` cannot read the tokens and repeats the two ground and spinner colours by hand; change them together.

**Contrast is measured, not eyeballed.** Every text pairing clears WCAG AA 4.5:1 and every informational non-text one (the focus ring, the scroll-edge rule) clears 3:1; the ratios sit in comments beside the values. Dracula's pastels cannot survive the light face — a filled control takes white text and every pastel falls short — so that face uses the darkest step of each hue that clears the floor, and the dark face keeps the pastels. Re-measure when a value changes rather than assuming a neighbouring step behaves the same.

**Roles shadcn does not name get their own token** rather than a literal in a component: `--success` and `--warning` for the badges, `--scroll-edge` for `UIScrollArea`'s affordance. Each is declared in both faces with its contrast measured, and mapped in `@theme inline` when a utility needs it. (The headless module's token block sat beside this one through the conversion and was deleted once nothing read it — two token systems coexisting was a transition state, not a pattern to copy.)

## Adding a component

```bash
pnpm dlx shadcn-vue@latest add <component>
```

It writes `web/components/ui/<component>/`, may pull a support dependency, and may overwrite a component you have already customized — so add on a clean tree and read the diff before staging. Vendored components are **not** auto-imported (`nuxt.config.ts`'s `components.dirs` registers only `@/components/_shared`); import them explicitly from `@/components/ui/<component>`.

## Vendored code

A vendored file is project source with an upstream ancestor. Both halves matter:

- **Edit it freely** — that is the point of the registry.
- **Annotate every deviation** per `conventions/code-annotations.md`: `// * Default: <original>` above a changed value, `// * Changes: <what/why>` above a changed block, `// * New …` for additions, and a note where something was removed rather than a silent deletion.

The payoff is a periodic upstream check (the procedure is in the project's operations notes): it reports upstream changes to components you vendored. `shadcn-vue diff` is the CLI's own answer, but in 2.8.2 it reports nothing for a project like this one — the runbook has the cause and the `add --overwrite` check used instead. Annotated deviations read as deliberate; unannotated ones are indistinguishable from bugs, and the check degenerates into noise nobody reads.

## Icons

`@lucide/vue`, chosen because the registry's own components import from it — any other set means patching every vendored component and fighting `diff` forever. Import the icon, size it with a utility (`class="size-4"`), and let `currentColor` carry the colour.

## Quirks

- **`cn()`** (`web/lib/utils.ts`) is `twMerge(clsx(...))`. Every vendored component merges its incoming `class` through it, which is why a caller's `px-6` beats the component's own `px-4` instead of losing to source order. Hand-written `:class` concatenation in a vendored component is a bug.
- **The CLI needs a valid `components.json`** — the MCP server, when connected, needs it too, and reports nothing useful when it is missing.
