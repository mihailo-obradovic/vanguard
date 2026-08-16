# Feature: User Management (Admin CRUD + RBAC)

## Status

Active

## Task Weight

Medium

## Purpose

Give admins full user lifecycle control — list, inspect, create (including minting admins), update, delete — behind a single role gate, while registration and self-service stay role-blind. The only role-gated surface in the system.

## Inputs

| Input                         | Type        | Source                               | Constraints                                                                                          |
| ----------------------------- | ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `name`                        | string      | `POST/PUT/PATCH /api/users[/{user}]` | required on create, `sometimes` on update; max 255                                                   |
| `email`                       | string      | body                                 | required on create, `sometimes` on update; lowercase, valid, max 255, unique ignoring the bound user |
| `password` (+`_confirmation`) | string      | body                                 | required on create, optional on update; `confirmed`, 8–255 (feature 001); omit key to keep current   |
| `role`                        | string      | body                                 | `sometimes`; enum `user`/`admin`; create default `user`, update omission keeps current               |
| `{user}`                      | route param | URL                                  | implicit model binding → 404 JSON on unknown id                                                      |

## Outputs And Side Effects

| Output / Side Effect                                    | Type              | Description                                                                                                               |
| ------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/users` → `{ data: UserResource[], total: n }` | 200               | full table, `latest()` order (created_at DESC); no pagination/filtering/search; `total` = full count                      |
| `show`/`store`/`update` → `{ data: UserResource }`      | 200 / 201 (store) | fields: `id, name, email, role (string), email_verified_at, created_at, updated_at`                                       |
| `DELETE /api/users/{user}`                              | 204               | hard delete (no SoftDeletes); orphaned `sessions` rows and `personal_access_tokens` are not cleaned up                    |
| Email change side effects                               | DB + queued mail  | shared `User::changeEmail()`: verification nulled + `VerifyEmailNotification` sent only when the address actually changed |

## Scope And Non-Goals

In scope: the `apiResource('users')` surface behind `auth:sanctum` + `admin`, the `Role` enum and its enforcement points, the admin SPA page `/users`.

Non-goals: self-service editing (feature 003); auth endpoints (feature 001); permissions beyond the two-role enum (no policies exist); pagination (a recorded gap, not implied behavior).

## User / System Behavior

- All five routes sit behind `auth:sanctum` (guests → 401 JSON) then `admin` (non-admins → 403 JSON `{"message":"Forbidden. Admin access required."}`); `UserRequest::authorize()` re-checks `isAdmin()` as a second gate.
- Create assigns name/email/password then `role = $data['role'] ?? Role::User` by property assignment, deliberately bypassing the fillable list (which excludes `role`).
- Update is a true partial update: only present keys apply; email goes through `changeEmail()` (same-email resubmission is a no-op); role changes only when the key is present. No `current_password` challenge — an admin changes any password, including their own, with just a session (deliberate asymmetry vs feature 003).
- Delete: self-deletion is blocked with 403 `"You cannot delete your own account."`; deleting other users (including other admins) is permitted and hard.
- SPA: table of all users with role/verification badges; create/edit modal (password optional in edit — key omitted when blank); delete confirmation dialog; success toasts; 422s inline via Regle external errors. Query invalidation runs in `onSettled` on the `users` keys.
- Frontend access control is backend-driven: the nav link is hidden for non-admins (cosmetic), but the route has no admin middleware — a logged-in non-admin who navigates to `/users` mounts the page, gets 403 from the API, is toasted and bounced to `/home`.

## Roles And Access

| Resource/action                               | Guest | User | Admin                           |
| --------------------------------------------- | ----- | ---- | ------------------------------- |
| `GET` list and show                           | 401   | 403  | ✔                               |
| `POST` (incl. `role: admin`)                  | 401   | 403  | ✔                               |
| `PUT/PATCH` (incl. role and password changes) | 401   | 403  | ✔                               |
| `DELETE`                                      | 401   | 403  | ✔ (404 unknown id; 403 on self) |

Walkthroughs — Admin: full table and all actions, including their own row (see Edge Cases). User: no nav entry; `/users` renders briefly, then 403 → toast + `/home`. Guest: `/users` → `/login` (feature 001).

## Examples

| Input                                     | Expected Output               | Notes               |
| ----------------------------------------- | ----------------------------- | ------------------- |
| `POST /api/users` with `role: "admin"`    | 201, `data.role = "admin"`    | admins mint admins  |
| `POST /api/users` without `role`          | 201, `data.role = "user"`     | controller default  |
| `PUT /api/users/{id}` `{name, role}` only | 200, email/password untouched | partial update      |
| `DELETE /api/users/{own-id}`              | 403, row intact               | the only self-guard |
| `GET /api/users` as non-admin             | 403                           | middleware gate     |

## Business Rules

- Role storage: plain string column, DB default `'user'`, cast to `App\Enums\Role` (`user`/`admin` — the only two values). The backing values are persisted data: renaming one orphans stored rows and breaks `UserResource`, the SPA's `z.enum(['user','admin'])`, and role badges.
- Admin creation paths: only this endpoint, plus the seeder's factory `admin()` state. Registration and profile cannot touch `role`.
- The SPA only ever sends PUT (never PATCH, though both are registered).

## Edge Cases

- **Self-demotion is unguarded**: `PUT /api/users/{own-id}` with `role: "user"` succeeds and locks the caller out of this surface; nothing prevents demoting the last admin. A real gap — no code guard, no test — not intended behavior.
- Sending `password: ""` fails min-length rather than clearing; the UI avoids it by omitting the key.
- `useFetchUser`/`GET /api/users/{id}` exist but no page consumes them.

## Invariants

- Every route stays behind `auth:sanctum` + `admin`; guests 401, non-admins 403.
- `role` never enters mass assignment — it is assigned explicitly and validated against the enum.
- Email changes here and in feature 003 share `changeEmail()` semantics: changed address ⇒ verification reset + one queued mail; same address ⇒ no-op.
- Responses stay in the `{ data: ... }` envelope (list adds `total`); the SPA parses them with `UsersResponseSchema`/`UserEnvelopeSchema` and breaks loudly on shape drift.

**Protected area (indexed in `project-summary.md`):** the `apiResource('users')` surface — paths, methods, status codes, and the envelope/`total` response shapes above. The persisted `Role` enum values fall under the DB-schema protection in `architecture.md`.

**Second transport.** Feature 007 exposes this domain over GraphQL too (`users` query, `updateUser` mutation), sharing `UserResource`, the validation rules, the `UserPolicy` admin check, and `App\Actions\UpdateUser` — a change to any shared rule must be verified on both transports.

## Error Handling

- 401/403/404/422 as tabled above; validation errors are standard Laravel 422 `{errors:{...}}` rendered inline in the modal; non-422 errors toast via the central handler.

## Entry Points

- `routes/api.php` (`apiResource` behind `['auth:sanctum','admin']`), `app/Http/Controllers/UserController.php`, `app/Http/Requests/UserRequest.php`, `app/Http/Middleware/EnsureUserIsAdmin.php`, `app/Enums/Role.php`, `app/Http/Resources/UserResource.php`.
- SPA: `web/pages/users.vue`, `web/services/user.api.ts`, `web/services/queries/useUserQueries.ts`, `web/layouts/Default.vue` (nav gating).

## Dependencies

- Feature 001: session, 401-JSON posture, central 401/403 handling, `isAdmin` store getter.
- Feature 003: shares `changeEmail()` and `UserResource`; the two update contracts must not drift.
- Queued notifications (verification mail on admin-initiated email change).

## Open Questions

## Tests

- `tests/Feature/UserManagementTest.php` — the gates (guest 401, non-admin 403), each verb's happy path (list newest-first with `total`, show, create admin, create default role, partial update with role promotion, hard delete), the self-delete 403, the exact response field set as a field-leakage guard, and the full `UserRequest` validation matrix incl. the two uniqueness cases. `ProfileTest.php` covers the shared email-change pair; `tests/Unit/UserPolicyTest.php` covers all four policy arms.
- Known gaps: 404s and non-GET 401/403; self-demotion & last-admin scenarios; `latest()` ordering unasserted; PATCH unexercised; post-delete orphan cleanup; no component test for `users.vue`. The frontend data layer behind it is covered (`web/services/_tests/user.api.spec.ts`, `web/services/queries/_tests/useUserQueries.spec.ts`).

## Verification

Endpoint behavior, validation pivot, and role semantics verified against controller/request/middleware source; SPA flow traced through `users.vue` and the query layer. Backend suite green (38 tests), with the self-delete guard asserting 403 + message per the http-layer status table.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
