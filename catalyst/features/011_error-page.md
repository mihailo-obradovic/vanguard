# Feature: Error Page

## Status

Active

## Task Weight

Easy

## Purpose

When Nuxt renders its error state — a signed-in user opening a URL no route matches, or a fatal error the app cannot recover from — the visitor gets a page that says what happened in their language and offers a way out, instead of a raw dump of the error object. Scoped to `variant/shadcn-vue`.

## Inputs

| Input         | Type        | Source                        | Constraints                                                          |
| ------------- | ----------- | ----------------------------- | -------------------------------------------------------------------- |
| `error`       | `NuxtError` | Nuxt, as the `error.vue` prop | `statusCode` (Nuxt defaults it to 500), `statusMessage?`, `message?` |
| Active locale | string      | `@nuxtjs/i18n`                | `en` / `sr-Latn` / `sr-Cyrl`                                         |

## Outputs And Side Effects

| Output / Side Effect | Type       | Description                                                                                                       |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Title                | UI         | a level-1 heading: `<statusCode> — <title>`, the title chosen by status (Business Rules)                          |
| Message              | UI         | one localized sentence chosen by status — never the error's own text                                              |
| Technical details    | UI         | a disclosure holding `{ statusCode, statusMessage, message }` as indented JSON, scrolling inside itself when long |
| Go home              | navigation | `clearError({ redirect: '/home' })` — clears the error state and navigates in-app                                 |
| Refresh              | navigation | `reloadNuxtApp()` — a full reload of the current URL                                                              |

## Scope And Non-Goals

In scope: `web/error.vue` rendered inside a new `web/layouts/Empty.vue` — a centred card on the page canvas with no navbar or footer — plus the vendored `collapsible` component and the seven `errors.page.*` keys in all three locales.

Non-goals:

- **Guests never see the 404.** The redirect policy treats any path it does not know as protected and sends a guest to `/home` before routing can fail (feature 001). Unchanged here.
- Master and the other variants: master and `variant/nuxtui` keep their stub; `variant/vuetify` keeps its own page.
- Distinct copy per status beyond 404 versus everything else; reporting errors anywhere (no logging service, no "send report" action); a colour-mode toggle or language picker on the page.
- Errors a component handles itself (toasts, inline field errors) — they never reach this page.

## User / System Behavior

- When Nuxt enters its error state, the page renders in the empty layout: one card, centred horizontally and vertically in the viewport, in the colour face the visitor already has.
- The card shows the title heading, the message, then Go home (primary) and Refresh (outline) side by side, then a collapsed "Technical details" disclosure.
- Opening the disclosure reveals the JSON; closing it hides it again. It never opens by itself.
- Go home leaves the error state and lands on `/home`; Refresh reloads the URL that failed.
- The top loading bar keeps the app's token colours, as on every other route.

## Roles And Access

Not role-specific. In practice a 404 is only reachable while signed in (see Non-Goals); a fatal error can reach anyone.

## Examples

| Input                                                                            | Expected Output                                                                                          | Notes                                    |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| signed in, open `/no-such-page` (`404`, message `Page not found: /no-such-page`) | heading `404 — Page Not Found`; message `The page you are looking for does not exist or has been moved.` | raw message only inside the details      |
| fatal error, `statusCode 500`, message `Internal Server Error`                   | heading `500 — Something Went Wrong`; message `An unexpected error occurred. Please try again.`          |                                          |
| fatal error, `statusCode 503`, message `Cannot read properties of undefined`     | heading `503 — Something Went Wrong`; same unexpected message                                            | developer text never becomes the message |
| open Technical details on the 404 above                                          | JSON with `"statusCode": 404`, `"statusMessage"` and `"message"` both `Page not found: /no-such-page`    |                                          |
| click Go home                                                                    | `clearError({ redirect: '/home' })`; the home page renders in the default layout                         |                                          |
| click Refresh                                                                    | `reloadNuxtApp()`; the failing URL loads again                                                           |                                          |
| active locale `sr-Cyrl`, 404                                                     | heading `404 — Страница није пронађена`; buttons `На почетну` / `Освежи`; disclosure `Технички детаљи`   |                                          |

## Business Rules

- Title: `statusCode === 404` → `errors.page.notFoundTitle`; any other status → `errors.page.unexpectedTitle`.
- Message: `statusCode === 404` → `errors.page.notFoundMessage`; any other status → `errors.page.unexpectedMessage`. The error's own `message` and `statusMessage` are developer-facing and appear only in the technical details.
- The technical details carry exactly `statusCode`, `statusMessage` and `message` — never `cause`, `data` or a stack.

## Edge Cases

- A very long `message` wraps inside the details block, which scrolls within a capped height rather than growing the card past the viewport; the scroll edge shows the scroll-affordance rule.
- On a 320px viewport the card fits the width and the two buttons stay side by side.
- A missing `statusMessage` or `message` is omitted from the JSON by `JSON.stringify`, not rendered as `undefined`.

## Invariants

- Every visible string on the page comes from `errors.page.*`, except the numeric status code and the JSON inside the collapsed details.
- The page renders without the default layout's navbar, dialogs or footer, so a failure in that shell cannot recur while showing the error.

No protected area — this feature owns no backend contract.

## Error Handling

- The page is the error handler's last surface; it makes no requests and has no failure path of its own.

## Entry Points

- `web/error.vue`: the page — status-based title and message, the details JSON, the two actions.
- `web/layouts/Empty.vue`: the standalone centred shell, sized with `100dvh` per `stacks/frontend/nuxt/page-layout.md` (Viewport units outside the chain).
- `web/components/ui/collapsible/`: vendored shadcn-vue disclosure.

## Dependencies

- Nuxt's error state (`NuxtError`, `clearError`, `reloadNuxtApp`).
- Feature 001's redirect policy (`web/utils/authRedirectLogic.ts`), which decides who can reach an unmatched URL.
- Vendored `ui/card`, `ui/button`, `ui/collapsible`; `UIScrollArea` for the details block; `@lucide/vue` icons.

## Open Questions

## Tests

- `web/_tests/error.spec.ts`: the 404 title and message; a non-404 status with a developer message shows the unexpected title and message and not the developer text; the details JSON holds exactly `statusCode`, `statusMessage` and `message`; Go home calls `clearError` with `{ redirect: '/home' }`; Refresh calls `reloadNuxtApp`.
- Live browser walk, both faces, at 320px and desktop width: the 404 path signed in, the disclosure opening and closing, Go home, Refresh, and one locale switch before triggering the error.

## Verification

- `web/_tests/error.spec.ts`: 5 pass; four deliberate breakages (developer message shown, `data` in the details, Go home to `/`, titles swapped) each fail one. Suite 443 passed; typecheck and lint clean.
- Walk, signed in on `/no-such-page`: at 320×640 no navbar, no horizontal overflow, buttons on one row in `en` and `sr-Cyrl`, no text below AA in either face; details show exactly three fields, and a 2,240-character message scrolls inside a 190px block with the edge rules. At 640×320 the layout scrolls the open card into reach. At 1280×800 Refresh fully reloaded the URL and Go home landed on `/home` in-app; console clean.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
