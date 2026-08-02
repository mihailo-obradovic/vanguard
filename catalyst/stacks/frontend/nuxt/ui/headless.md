# Stack: Frontend UI — Headless

**Layer:** Frontend / UI
**Tool:** none — project-owned primitives

No component library. The project owns its markup and its CSS, and builds the small set of primitives it actually needs.

Choose this when the design is bespoke enough that a library would be fought rather than used, when the bundle budget is tight, or when the component surface is genuinely small — a handful of forms, a table, a dialog. Choose a library instead when the app is broad, when accessible behaviour (focus traps, roving tabindex, listbox semantics) would otherwise be hand-rolled, or when the team's velocity matters more than the last 5% of visual control.

Adopting a library later is a decision record and a real migration, not a config change. This choice is worth making deliberately rather than by default.

## What the project owns

- **Styling** is `<style scoped>` per component, over the design tokens the project defines. Nothing global except the token definitions and rare base-element defaults.
- **Primitives** live in the auto-registered shared component directory (`../../_vue/component-naming.md`) and follow the `UI*` naming rule when they carry no domain content.
- **Accessible behaviour is the project's problem.** A hand-rolled dialog needs a focus trap, an escape handler, `aria-modal`, and focus restoration on close; a hand-rolled menu needs arrow-key navigation. Budget for it, or take a library. The style audit checks the outcome, not the effort.

## The field-error presenter

The one primitive a form-heavy app should build first, because the data layer's validation path (`../validation.md`) needs somewhere to render server messages: a small component taking Regle's `$errors` array and rendering the first entry.

Give it a **fixed minimum height**. A message that appears and disappears without one shifts everything below it while the user is mid-form, moving the control they were about to click.

## Avoid By Default

- A CSS framework adopted "just for utilities" — that is a library choice by another name, and belongs in a decision record.
- Copying a component library's markup without its behaviour: the visual result looks right and the keyboard and screen-reader result is worse than a plain `<button>`.
