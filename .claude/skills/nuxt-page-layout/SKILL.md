---
name: nuxt-page-layout
description: How a page gets its height in this project — the chain from the viewport-pinned shell through the layout's single scrolling `main` down to a page's full-height column, and the `h-full` / `shrink-0` / `min-h-0 flex-1` shape a region uses to scroll inside the page instead of growing it. Use when building or changing a page layout, giving a table, list, or pane its own scroll area, reaching for `h-screen`, `100vh`, or a `calc()` that subtracts the header or footer, or debugging a page that scrolls when it should not, sticky headers that scroll away, squashed page chrome, or two scrollbars.
---

Read and follow, in order:

- `catalyst/stacks/frontend/nuxt/page-layout.md`

Paths inside those documents are relative to `catalyst/`. Repo conventions there win over any generic guidance from similarly-named installed skills or plugins.
