# Stack: Frontend UI — shadcn-vue

**Layer:** Frontend / UI
**Tool:** shadcn-vue (new-york) · Reka UI · Tailwind CSS 4 · Lucide

Not a component library — a **registry of source you own**. The CLI copies a component's source into `web/components/ui/`, and from that moment it is this project's file: editable, reviewable in git, and never updated by a package bump.

That single property drives every rule here. There is no upstream to break, so customization is cheap; but there is also no upstream to fix you, so a customization that is not _legible_ is a customization nobody dares touch again.

- Components are used **PascalCase** in templates (`<DialogContent>`, `<Button>`) — they are project files, so the project-component half of the tag-casing rule in `../../../_vue/vue-style.md` applies, not the library half.
- **Tailwind utilities are the styling system.** `<style scoped>` is the exception that needs a reason, not the default.
- **Colour comes from the CSS variables** in `web/assets/styles/main.css`. A vendored component references them through its Tailwind classes (`bg-background`, `text-muted-foreground`); a hardcoded colour anywhere is a smell.
- **Reka UI is the behaviour layer** underneath. Accessible semantics — focus traps, roving tabindex, listbox roles — arrive with the vendored component; do not hand-roll them and do not fight them.
- Validation is **Regle against `ui/field`**, never `ui/form` ([`components.md`](components.md), Forms).

## Optimal beats parity

Where this project also runs the same product on another UI module (`variant/vuetify`), the compositions are worth comparing but are **not** a target. Write what is optimal for shadcn-vue and Reka UI; a composition that diverges from another variant's needs no justification. What does need justification is diverging from _this_ module's idioms.

## Module Documents

| Document                         | What it holds            | Load                                                                                                                             |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| [`setup.md`](setup.md)           | Configuration and wiring | When adding a component, changing the theme, or debugging a missing import, an unstyled component, or a class that has no effect |
| [`components.md`](components.md) | Composition patterns     | When building a dialog, form, table, or toast, or deciding whether something stays project-owned rather than vendored            |

## Avoid By Default

- **Hand-rolling what the registry has.** Reach for `shadcn-vue add <component>` before writing markup. The registry is the default answer; a hand-rolled primitive needs a reason recorded next to it.
- **Wrapping a vendored component to "own" it.** You already own it — edit the vendored file. A wrapper earns its place only for a genuinely repeated _composition_ (`FormDialog`), never for consistency's sake.
- **Editing a vendored component without a `Default:`/`Changes:` annotation.** Undocumented drift makes the next `shadcn-vue diff` unreadable (`setup.md`, Vendored code).
- **`ui/form` and vee-validate.** This project validates with Regle; `ui/field` is validation-library-agnostic and is what `ui/form` merely wraps.
- **A second component library alongside it**, and equally: a second toast, dialog, or table implementation left standing after its replacement lands.
