---
applyTo: '**/*.vue, **/*.ts'
---

When defining types, apply the following rules:

- Use `type` definition by default, unless you need to use `interface` for inheritance.
- If the type is a simple primitive or a specific string, used in only one place, define it inline.
- If the type is specific to a component, define it at the top of the script section, after imports.
- If the type is used in multiple places, define it outside and import it. If the type is specific to a feature or corresponds to a service file in `@/web/services`, create a dedicated file for it in `@/web/types`. Otherwise, use `@/web/types/general.ts`.
