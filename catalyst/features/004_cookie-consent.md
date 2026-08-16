# Feature: Cookie Consent

## Status

Active

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
| Banner visibility       | UI     | fixed bottom banner shown while the choice is undecided, hidden (with transition) once set  |
| `hasConsented` computed | state  | `true` only when the stored value is `accepted` — exposed for future gating (see Non-Goals) |

## Scope And Non-Goals

In scope: the `useCookieConsent()` composable (read/write the cookie, expose `isDecided`/`hasConsented`/`accept`/`decline`) and the `CookieConsentBanner.vue` UI mounted globally in `web/app.vue`.

Non-goals: actually gating any cookie, script, or analytics on the choice — `hasConsented` is exposed but nothing consumes it yet; a full preferences/category manager; a server-side record of consent; blocking first render on the decision.

## User / System Behavior

- On first load with no `cookie_consent` cookie, the banner slides in at the bottom offering Accept / Decline.
- Clicking Accept or Decline writes the cookie and hides the banner (slide-out transition); the choice persists for a year, so the banner does not reappear on later visits.
- The banner renders only after client mount, avoiding a flash before mount (the app is `ssr: false`).
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

- The decision is stored client-side only, in the `cookie_consent` cookie.
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
- `web/components/shared/CookieConsentBanner.vue`: the banner UI.
- `web/app.vue`: mounts the banner once, globally.

## Dependencies

- Nuxt `useCookie` for persistence; Vue `Transition` for the slide animation. No backend, no other feature.

## Open Questions

## Tests

- None currently. Candidate cases when tests are added: banner shows when undecided, hides after accept/decline, cookie value written correctly, no banner when the cookie is pre-set.

## Verification

Behavior traced against source: cookie name, values and `maxAge` in `useCookieConsent.ts`; visibility, mount guard and ARIA attributes in `CookieConsentBanner.vue`; global mount in `web/app.vue`. `hasConsented` has no consumer — the gating hook is dormant. No automated tests exist yet.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
