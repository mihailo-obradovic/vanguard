# Decision: Testing rulebook — one doctrine, global defaults, three exceptions

## Status

Implemented

## Type

process

## Task Weight

Easy

## Context

The testing doctrine grew across three records: 008 (strategy, placement, levels), 009 (Khorikov quality rules, MSW at the wire, mutation audits — partially reversing 008's mocking seam), and 011 (the never-gated coverage answer 008 deferred, still `Proposed`). Reading the doctrine meant reading all three plus their cross-corrections, and exception-shaped wording ("cover everything, except this folder, except this case") had accumulated in the rule documents. The state itself is settled — every gap closed or deliberately excluded, every survivor triaged — so this record consolidates and transcribes; it re-decides nothing.

## Decision

- **One rulebook.** This record is the single *why* behind the testing doctrine. The binding rules stay where agents load them: `conventions/testing.md` (universal quality rules) and the stack testing modules (`stacks/backend/laravel/testing.md`, `stacks/frontend/nuxt/testing.md`), which act as the BE/FE annexes. Rejected: separate FE/BE annex files — the stack modules already play that role.
- **008, 009, and 011 are superseded and deleted**, not kept with `Superseded by` statuses: git holds the history, and the repo is a template base. This becomes a standing rule (Domain Decision Index); `Superseded by` remains available for a record genuinely worth keeping.
- **The doctrine, consolidated** (transcription of what 008/009 decided and the suite now embodies): logic layers get unit tests and the data layer runs against MSW at the wire; backend behavior is proven by feature tests over real HTTP against the production database engine; components earn mounted tests only when they carry real logic; tests live in `_tests/` beside the code (frontend) and Laravel's layout (backend); the Khorikov framework governs test quality; E2E stays deferred (adopting it is a new record) and snapshots stay rejected; mutation testing is a periodic audit — every survivor triaged, fixed or recorded with a reason.
- **Exceptions are few, global, and justified.** Every deliberate omission derives from exactly three exceptions plus a legibility meta-rule, now stated normatively in `conventions/testing.md` (What is deliberately not tested). Folder- and file-level carve-outs are no longer rules — they are instances.
- **Coverage and mutation scores stay measured, never gated** (absorbs 011). The deliberate exclusions make any project-wide threshold dishonest — a number tuned around a *correct* 0% measures nothing; a gated measurement stops being one (Goodhart); and regressions are legible without a gate, since CI prints both scores and the runbook's per-file register says what is deliberately untested. Rejected, and first to reconsider if the trigger fires: a per-directory floor on the contract layers (utils, services, stores, composables). Revisit trigger: a coverage or mutation regression that review demonstrably missed, or a second regular contributor.

## Scope

This record; `conventions/testing.md` (new exception section); `stacks/frontend/nuxt/testing.md` (gating paragraph settled, exception wording re-derived); deletion of `decisions/008`, `009`, `011`; pointer sweep (`operations.md`, features 005/006, `stacks/frontend/nuxt/nuxt.md`); `project-summary.md` (ADR index, Domain Decision Index). No code, no behavior contracts; the backend module needs no change.

## Consequences

- One record answers "why is testing like this?"; the rule documents carry no stale revisit clauses.
- The deleted records' narratives (survivor triage stories, gap-closure timeline) live only in git history — accepted deliberately.
- "Why is this file untested?" now has a checkable answer: it names its exception in the runbook register, or it is an oversight.
- Follow-ups, already ticketed: trim `operations.md`'s dated audit narratives to current state; port the doctrine to the Catalyst template.

## Contracts Touched

- `conventions/testing.md` — the exception set (normative home; single source).
- `stacks/frontend/nuxt/testing.md` — coverage stance and exception wording bind to the convention.
- `project-summary.md` — ADR index; Domain Decision Index row for delete-at-supersession.
- `operations.md`, `features/005`, `features/006`, `stacks/frontend/nuxt/nuxt.md` — pointers repointed here.

## Open Questions

## Verification

Doc-only — the record is the deliverable; the Catalyst validator is clean. The settled figures it transcribes were measured: backend 100% lines / 82.06% mutation; frontend `master` 54.79% statements / 92.76% mutation, `variant/vuetify` 77.35% / 82.98% (branch totals not comparable — different mutated surfaces); every survivor triaged in `operations.md`.
