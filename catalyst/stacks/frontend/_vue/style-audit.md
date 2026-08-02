# Vue Style Audit

**Tier:** Frontend — Vue

Audit Vue SFCs (and composable/util `.ts` files) for conformance to the style guide, then apply fixes. Invoked via the generated `audit-vue-style` skill wrapper or directly.

**Authoritative rules:** [`vue-style.md`](vue-style.md) (with worked examples in [`vue-style-examples.md`](vue-style-examples.md)), [`component-naming.md`](component-naming.md), and [`../_common/component-naming.md`](../_common/component-naming.md).

**Target:** the target files/directory given by the caller. If the target is a directory, audit all `.vue` files in it recursively (and `.ts` files for composables/utils/stores). If it is a single file, audit just that file.

## What to Check

For each file, verify and fix:

### SFC block order

- `<template>` → `<script setup>` → `<style scoped>`. Flag any other order.
- `<script setup lang="ts">` — flag Options API, a bare `<script>`, or a missing `lang="ts"`.

### Template

- **PascalCase** for project components, **kebab-case** for library components. No exceptions.
- Empty line between neighboring elements at the same hierarchy level.
- `v-for` has a stable, unique `:key`. Flag `:key="index"` unless the list is provably static.
- **`v-if` and `v-for` never share an element** — the fix is a `computed` that pre-filters.
- Inline conditionals at most one level deep. Flag nested ternaries and stacked `v-if`/`v-else-if` chains; suggest `v-show`, a slot, or subcomponent extraction.
- Custom CSS only where the project's utility system cannot express it.
- Emit names are events (`@save`, `@update:modelValue`), parent handlers are `handle*`. Every emit declared in `defineEmits`.
- Icon-only interactive elements have an accessible name on the control and `aria-hidden` on the icon. Decorative SVGs are `aria-hidden`.

### Script — imports and the auto-import boundary

- **`@/` alias everywhere; flag every `~/`.**
- Flag explicit imports of auto-imported symbols: Vue reactivity, framework built-ins, `composables/`, `utils/`, and components in the auto-registered directories. Removing them is safe and is the single most common fix.
- Flag missing explicit imports: external packages, and components outside the auto-registered directories.
- Check the project's actual auto-import configuration before flagging either direction — a project that narrowed the defaults records it in a convention annex, and the annex wins.
- Type-only imports use `import type` and come last. Shared types live in `@/types/`, never redefined inline (`../../_lang/typescript/typescript-types.md`).

### Script — section order

Verify the twenty-one sections in `vue-style.md` appear in order, and that the four groups (imports 1–5, declarations 6–7, wiring 8–14, logic 15–21) are separated by blank lines.

**Do NOT auto-fix a section reordering.** Moving declarations past each other can change evaluation order and break a file that currently works — a composable reading a ref declared below it, a `computed` capturing a store binding, a `defineProps` result consumed by an earlier line. Report each ordering violation with its `file:line` and the move it wants, and leave the code alone unless the caller asks for the move specifically.

Everything else in this document is safe to fix directly.

### Script — declarations and structure

- `defineProps` → `defineModel` → `defineEmits`, in that order.
- Props typed explicitly, optional props included. Flag untyped or inferred-only props.
- `defineProps` bound to a `const` **only** when script logic reads it — flag an unused `const props`.
- `useTemplateRef` for template refs rather than a bare `ref()`.
- Store access destructures `storeToRefs()` for state, plain destructuring for actions. Flag a local wrapper property that only re-exposes a store value.
- Local composables (section 21) sit at the bottom of the script block, not interleaved.
- **Feature grouping:** a feature's refs, computed values, functions, and watchers stay together. Flag logic scattered across sections 15–17 that belongs to one feature.

### Style block

- `<style scoped>` by default — an unscoped block needs a comment giving the reason.
- No preprocessor the stack does not already ship.

### General rules

- Empty lines between major blocks.
- `if + return` over `if/else`; guard clauses over deep nesting.
- **`function` syntax** for component methods; arrow syntax only for inline callbacks and array-method arguments.
- No unused code unless a nearby comment explains why.
- No bare top-level `await` in setup — it suspends the component. Async work belongs in lifecycle hooks, `watch`, or the data layer.

### Naming

- File names per `../_common/component-naming.md` — PascalCase, no `*Section` suffix or brand prefix, self-describing basenames, kebab-case folders.
- Auto-import tag resolution per `component-naming.md`: flag a nested file under the registered directory whose generated tag stutters (`_shared/users/UserCard.vue` → `<UsersUserCard>`).

### Accessibility

- Every interactive element is keyboard-reachable and has an accessible name.
- A non-native control carrying `role="button"` activates on **both** Enter and Space.
- The app shell or page renders a `<main>` landmark with a "Skip to main content" link as the first focusable element when absent.

## Output

The audit's success criterion is the re-check against the baseline — conformance counts standing in for measurements:

1. **Baseline.** Scan every target file and record the violations found, with `file:line` references, counted per check section above (block order, template, imports, section order, declarations, style, general, naming, accessibility). The counts are fixed before any fix is applied.
2. **Fix.** Apply the fixes directly, except section reordering, which is reported and left alone. If any other fix is ambiguous or would change behavior, flag it and skip — a flagged item is not a failure, but it must be listed with its reason.
3. **Re-check.** Re-scan the audited files: remaining violations must be zero, flagged, or reported-not-fixed section orderings. A fix that did not survive the re-scan is reported, never silently dropped.
4. **Gate.** The project's typecheck and lint pass after the fixes. A fix that breaks either is reverted and flagged.

End with the summary: files audited, violations found vs fixed vs flagged vs reported-only per category, and the gate result.
