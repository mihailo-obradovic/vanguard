# Feature: Cookie Consent

## Status

Active

Retro-documented at brownfield adoption (2026-08-04) from code. Frontend-only; no backend contract.

## Task Weight

Easy

## Purpose

Present a dismissable banner that records the visitor's accept/decline choice for non-essential cookies and remembers it across visits — the minimum consent surface a public-facing SPA needs before layering analytics or other non-essential cookies on top.

## Inputs

| Input            | Type       | Source                                 | Constraints                                         |
| ---------------- | ---------- | -------------------------------------- | --------------------------------------------------- |
| Accept click     | user event | `CookieConsentBanner.vue` button       | sets `cookie_consent=accepted`                      |
| Decline click    | user event | `CookieConsentBanner.vue` button       | sets `cookie_consent=declined`                      |
| `cookie_consent` | cookie     | browser (read on load via `useCookie`) | `'accepted' \| 'declined' \| null`; `maxAge` 1 year |

## Outputs And Side Effects

| Output / Side Effect    | Type   | Description                                                                                 |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------- |
| `cookie_consent` cookie | cookie | persisted choice, 1-year `maxAge`; absent until the user decides                            |
| Banner visibility       | UI     | modal bottom sheet (with scrim) shown while the choice is undecided, hidden once set        |
| `hasConsented` computed | state  | `true` only when the stored value is `accepted` — exposed for future gating (see Non-Goals) |

## Scope And Non-Goals

In scope: the `useCookieConsent()` composable (read/write the cookie, expose `isDecided`/`hasConsented`/`accept`/`decline`) and the `CookieConsentBanner.vue` UI mounted globally in `web/app.vue`.

Non-goals: **actually gating any cookie, script, or analytics on the choice** — `hasConsented` is exposed but nothing consumes it yet (recorded gap below); a full preferences/category manager; a server-side record of consent; blocking first render on the decision.

## User / System Behavior

- On first load with no `cookie_consent` cookie, a modal bottom sheet slides in offering Accept / Decline; its scrim blocks page interaction until the visitor decides (persistent — outside clicks and Esc do not dismiss it).
- Clicking Accept or Decline writes the cookie and hides the sheet (slide-out transition); the choice persists for a year, so the sheet does not reappear on later visits.
- The banner only renders after `onMounted` sets an `isMounted` flag — avoiding a flash before the component is client-mounted (the app is `ssr: false`).
- The banner is `role="region"` with `aria-label="Cookie consent"`.

## Roles And Access

Not role-specific — shown to every visitor including guests, independent of authentication.

## Examples

| Input                        | Expected Output                                        | Notes                    |
| ---------------------------- | ------------------------------------------------------ | ------------------------ |
| First visit, no cookie       | banner visible                                         | `isDecided` false        |
| Click Accept                 | cookie `accepted`, banner hidden, `hasConsented` true  | persists 1 year          |
| Click Decline                | cookie `declined`, banner hidden, `hasConsented` false | persists 1 year          |
| Return visit with cookie set | no banner                                              | `isDecided` true on load |

## Business Rules

- The decision is stored client-side only, in the `cookie_consent` cookie (`maxAge` = 60·60·24·365 seconds).
- Declining does not remove or block any cookie today (nothing is gated); it only records the preference.

## Edge Cases

- Clearing the cookie (or expiry after a year) brings the banner back on the next load — by design.
- No "change your mind" affordance exists once decided; re-prompting requires clearing the cookie.

## Invariants

- The banner is hidden whenever `cookie_consent` is set to any non-null value.
- The stored value is one of `accepted` / `declined` — never an arbitrary string.

No protected area — this feature owns no backend contract and no cross-feature invariant.

## Error Handling

- No network calls and no failure modes; a missing/unreadable cookie is treated as "undecided" (banner shown).

## Entry Points

- `web/composables/useCookieConsent.ts`: the cookie read/write and derived state (`isDecided`, `hasConsented`, `accept`, `decline`).
- `web/components/_shared/CookieConsentBanner.vue`: the banner UI (auto-imported from `components/_shared/`).
- `web/app.vue`: mounts the banner once, globally.

## Dependencies

- Nuxt `useCookie` for persistence; Vuetify `v-bottom-sheet` for the modal presentation and slide animation. No backend, no other feature.

## Open Questions

## Tests

- None currently. Candidate cases when tests are added: banner shows when undecided, hides after accept/decline, cookie value written correctly, no banner when the cookie is pre-set.

## Verification

Behavior traced against source on 2026-08-04: `useCookieConsent.ts` (cookie name, values, `maxAge`, derived computeds) and `CookieConsentBanner.vue` (visibility bound to `!isDecided`, `onMounted` guard, ARIA attributes), mounted in `web/app.vue`. Repo-wide grep confirms `hasConsented` has no consumer — the gating hook is dormant. No automated tests exist yet.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
