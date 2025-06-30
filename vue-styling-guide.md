# Vue Styling Guide

## Intro

This document outlines the preferred structure and style for Vue components in our projects. It is designed to ensure consistency, readability, and maintainability across the codebase. The following sections describe how to organize and write different parts of a Vue component.
We follow modern standards based on Vue 3 and Nuxt 3, with support for auto-imports of composables, stores, shared components, and utility modules. These conventions are designed to work well with IDE autocompletion, static analysis, and team collaboration.

> Note: This guide assumes flexibility in the choice of UI libraries. Vuetify-related suggestions apply only if Vuetify is used in the project.

## Template Structure

- Leave an empty line between neighboring HTML tags of the same hierarchy level.
- If Vuetify is used, prefer Vuetify helper classes before writing custom CSS.
- Use **PascalCase** for custom components. If Vuetify is used, follow **kebab-case** for its components..
- Avoid deep `v-if/v-else` nesting. Prefer `v-show`, `v-slot`, or `v-for` with pre-filtered data.
- Break down complex templates into smaller, logical subcomponents or use slots.

## Script Structure

- Always use `<script setup lang="ts">` for consistency and TypeScript support.
- Use the `@/` alias for imports; avoid `~/`.
- Assume auto-imports for project-level modules and shared components. Explicitly import only external packages or anything not in `@components/shared`.

> Note: Section order is optimized for clarity, separation of concerns, and AI/autocomplete compatibility.

### 1. Dependency Imports

- If the file uses any libraries, import them at the top of the script section.
- Order these from those that are used in the core of the component to those that are used less frequently or are more specific.
- Always leave an empty line between different import categories.

### 2. Component Imports

- Use PascalCase for naming.
- Group similar components together.

### 3. Service Imports

- Utility and API modules from `@/services`, `@/utils`.

### 4. Type Imports

- Use explicit `import type` for types from `@/types`, third-party packages, or local files.
- Group type imports separately from runtime imports.

---

### 5. `definePageMeta`

- Nuxt-specific function for route metadata.
- Place immediately after imports.

### 6. `defineProps`, `defineModel`, `defineEmits`

- Define the public API of the component.
- Recommended order: `defineProps`, then `defineModel`, then `defineEmits`.

---

### 7. Built-in composables

- Destructure built-in Vue composables like `useRoute`, `useRouter`, `useAttrs`, `useSlots`.
- Place them right after defineProps / defineEmits.
- Keep related composables grouped together.

### 8. External composables

- Composables from packages like `@vueuse/core`, `pinia`, etc.
- Group by package if there are multiple.

### 9. Store usage

- For Pinia stores, always use `ref()` syntax for state, getters, and actions.
- Always use `ref()`-style access where applicable.

### 10. Service destructuring

- Functions extracted from utility/service modules.

### 11. Local composables

- Composables defined in `@/composables` used only in this component.

---

### 12. Template refs

- `ref()` variables linked to DOM or component instances.

### 13. Computed properties

- Group related `computed()` values together.

### 14. Functions

- Define all functions using the `function` keyword (not arrow functions).
- Group by type (e.g., event handlers, async operations, helpers).

### 15. Watchers

- `watch`, `watchEffect`, `watchPostEffect`.
- Recommended order: basic `watch` → special `watchEffect` → `watchPostEffect`.

### 16. Lifecycle hooks

- `onBeforeMount`, `onMounted`, `onUnmounted`, etc.
- Order them in the same order the lifecycle progresses.

### 17. Immediate executions

- Code that needs to run immediately on setup (previously in `created()`).
- Only use if it doesn’t belong in a lifecycle hook or computed/watcher.

### 18. `defineExpose`

- At the very end, if needed to expose methods or data to the parent.

--- 

### TypeScript Usage

- Use `<script lang="ts">` when component logic benefits from typing.
- Prefer explicit types for props, emits, and function signatures.

---

## Style Structure

- Use `<style scoped>` when necessary.
- Only write custom CSS if built-in utility or framework classes (e.g., Vuetify, Tailwind) don't suffice.
- Always place the `<style>` block at the bottom of the file.

---


## General Guidelines

- **Add empty lines between major blocks**: imports, props, composables, refs, functions, etc.
- **Prefer `if + return` over `if/else`**, especially at the end of a block.
- **Avoid deeply nested logic or large `if/else` blocks** — use early returns and guard clauses.
- **Group similar logic together**, e.g., all watchers in one place.
- **Always use `function` syntax**, not arrow functions, for methods.
- **File section order**: `<template>` → `<script setup>` → `<style>`.
- **Use `@/` instead of `~/` for imports**.
- **Assume auto-imports are enabled** for composables, stores, utils, and shared components.
- **Remove unused functions, imports, hooks**.
- **Keep async logic in hooks, `watch`, or `computed` — not top-level.**
- Use `pnpm` for package management across the project.


---

<!-- definePageMeta
defineProps
defineModel
defineEmits
--------------------
built-in composable destructuring
composable destructuring
store destructuring
service destructuring
inner composable destructuring
--------------------
template refs
refs/computed properties
functions
watchers
inner composables
onBeforeMount/onMounted
onBeforeUnmount/onUnmounted
Immediate executions (what used to be created())
defineExpose -->
