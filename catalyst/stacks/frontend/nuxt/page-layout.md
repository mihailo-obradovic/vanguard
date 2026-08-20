# Nuxt Page Layout

**Layer:** Frontend
**Tool:** Tailwind CSS 4 · Nuxt layouts

How a page gets its height. The shell owns the viewport and `main` is the only scrolling region (`design-system.md` for the values, `nuxt.md` for the shell files); this document is the page-side half — what a page may assume about its own height, and what it has to do when a region inside it needs to scroll instead of the page.

## The height chain

Height flows down one unbroken chain. Every link is required; break one and everything below it collapses to content height.

1. **The stylesheet** pins `html`, `body`, and `#__nuxt` to `height: 100%` with `overflow-y: hidden`. The shell is exactly the viewport and never scrolls, which is what keeps the header and footer in place.
2. **The layout** is a column (`flex h-full flex-col`): header and footer are `shrink-0`, the row between them is `flex min-h-0 flex-1`, and `main` inside that row is `flex min-h-0 flex-1 flex-col overflow-y-auto`.
3. **`main` is therefore a flex column of definite height** — which is the only reason a page root can say `h-full` and get a real number back.

The chain already subtracts the header and the footer. **Nothing below it does that arithmetic again**: no `h-screen`, no `100vh` or `100dvh`, and above all no `calc(100vh - <header> - <footer>)`. `--ui-header-height` exists so the header can _set_ its height, not so a page can subtract it — the moment a page hardcodes that sum it is wrong on the next chrome change, and wrong at once on any breakpoint where the footer wraps.

## The two kinds of page

**Ordinary flow — the default.** The page renders its content and stops. If it is taller than `main`, `main` scrolls; if it is shorter, it sits at the top. Most pages are this and need no height classes at all.

**Full-height column — the opt-in.** Use it only when one region inside the page must scroll while the rest of the page stays put: a table whose column headers stay visible under `sticky`, a chat log pinned above its composer, a list beside a detail pane. The shape:

```html
<div class="flex h-full flex-col">
  <!-- fixed chrome: every sibling that is not the scrolling region -->
  <div class="shrink-0">…header, filters, counts…</div>

  <!-- the one region that absorbs what is left and scrolls inside itself -->
  <u-table class="min-h-0 flex-1" sticky />
</div>
```

Three rules make it work, and all three are load-bearing:

- **`h-full` on the page root.** It resolves against `main`, so the column is exactly the space between the header and the footer.
- **`shrink-0` on every fixed child.** Without it flexbox shrinks the page's own chrome to make room for the overflowing region — headings and counts compress before the table does.
- **`min-h-0 flex-1` on the scrolling child, and on exactly one child.** `flex-1` claims the leftover space. `min-h-0` is the half that gets forgotten: a flex child's default `min-height: auto` refuses to shrink below its content, so without it the region grows the column, the column grows past `main`, and the _page_ scrolls instead of the region — sticky headers scroll away with it. Two `flex-1 min-h-0` siblings split the space and both scroll, which is almost never what was wanted.

Nested columns repeat the pattern: an intermediate wrapper that contains a scrolling descendant needs `min-h-0` too, or it re-imposes its content height on everything under it.

## What a page must not do

- **Never introduce a second scrolling region in the page frame.** `overflow-y-auto` on the page root gives two nested scrollbars and a wheel that stops at the wrong boundary; the scroll belongs on the inner region or on `main`, never in between.
- **Never set a fixed pixel height on a content region** to make it fit — the height comes from the chain (`design-system.md`, §4 Heights).
- **Never reach up.** A page that needs the layout to change asks for it in the layout, not with a positioned element escaping `main`.

## Diagnosing it

| Symptom                                                   | Cause                                                                              |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| The whole page scrolls and sticky headers scroll away     | Missing `min-h-0` on the scrolling child (or on a wrapper between it and the root) |
| The region is the height of its content, not the leftover | Missing `flex-1`, or an ancestor in the chain is not a flex column                 |
| The column is the height of its content, not of `main`    | Missing `h-full` on the page root, or `main` lost `flex-1`                         |
| Headings and toolbars squash as the list grows            | Missing `shrink-0` on the fixed children                                           |
| Two scrollbars                                            | A second `overflow-y-auto` between `main` and the scrolling region                 |
| Content sits under the footer on mobile                   | A `100vh`/`h-screen` somewhere in the page — remove it, the chain already fits     |

## Comments

The pattern is documented here, so a page that follows it needs no explanatory comment — the classes are the convention, and repeating the rationale on every page is the duplication this document replaces (`conventions/code-annotations.md`). Annotate only a genuine deviation: a page that departs from the shape says why, in one `// !` line.
