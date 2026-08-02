# Code Annotations

**Trigger:** editing vendored or generated code, or annotating any deliberate deviation from a default — in any language, on every project.

Conventions for annotating code so that **deliberate deviations from a default** — and other noteworthy facts — are visually distinct and structurally recognizable at a glance. They bind every project regardless of stack; the examples below are TypeScript because that is where vendored code is most common, but the markers carry into any comment syntax.

Use the **default** marker meanings — no editor-side override — so they work out of the box for anyone who has the rendering extension installed, and stay meaningful (as ordinary comments) for anyone who does not. The extension itself is recommended in [`editor-setup.md`](editor-setup.md).

This doc is the **single source of truth** for what each marker means. Other docs reference it instead of restating the table.

---

## Markers

| Marker    | Color  | Meaning              | Use for                                                                       |
| --------- | ------ | -------------------- | ----------------------------------------------------------------------------- |
| `// *`    | green  | customization / note | any deliberate deviation from a default, or a noteworthy fact worth surfacing |
| `// !`    | red    | alert                | gotchas, upstream bugs, rendering/boundary caveats, "do not change this" warnings |
| `// ?`    | blue   | query                | open questions (rare)                                                         |
| `// TODO` | orange | to-do                | follow-ups                                                                    |

The marker is the token after the comment opener, so it carries into every comment syntax the same way: `# * ...` in Python, YAML, and shell, `{/* * ... */}` in JSX, `/* ! ... */` in CSS.

---

## Patterns

The point is that a reader (and a reviewer) can tell **what changed and what it used to be** without diffing against an upstream source. Prefer these recognizable forms:

- **Changed a value** — put the original on a `// * Default: <original>` line directly above the new value, or inline:

  ```ts
  size: 'sm', // * Default: 'default'
  ```

- **Changed a longer string / block** — a `// * Changes: <what/why>` header above, with the original preserved (as a `// * Default:` note or a commented-out line):

  ```ts
  // * Changes: tighten vertical rhythm for dense layouts
  // * Default: 'mt-8 pb-24 space-y-12'
  base: 'mt-4 pb-12 space-y-8',
  ```

- **Added something new** — mark it so it's obviously not part of the original:

  ```ts
  // * New variant
  accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
  ```

- **Removed something** — leave a note rather than silently deleting, so the deviation stays visible:

  ```ts
  // * `animate-in` removed — applied conditionally by the wrapper on scroll instead
  ```

- **Warn about a footgun** — use `// !` for things that will bite someone who edits nearby:

  ```ts
  // ! Do not alias here — @/ isn't resolvable during this module's SSR load
  ```

---

## Why

Vendored or generated code (UI primitives vendored from a registry, config objects copied from upstream defaults) has no separate "base" file to diff against — the file _is_ the base until we edit it. Annotating every deviation in place keeps the base **recoverable from the comments** and makes intentional changes stand out from the generated boilerplate.
