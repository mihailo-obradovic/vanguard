# Domain Docs

How the engineering skills consume this repo's domain documentation. This repo runs under Catalyst governance, so the skills' default locations (`CONTEXT.md` at the root, `docs/adr/`) do not exist here — the Catalyst bundle holds everything.

## Before exploring, read these

- **`catalyst/context/domain-glossary.md`** — the glossary (`CONTEXT.md` in the skills' vocabulary). If it is missing or empty, proceed silently; `/domain-modeling` fills it lazily when terms actually get resolved.
- **`catalyst/decisions/`** — the ADRs. Read the records that touch the area you're about to work in; `catalyst/project-summary.md` (ADR Index) routes you — never load the directory wholesale.
- **`catalyst/features/`** — behavioral contracts, also indexed in `project-summary.md`. Skills that need "the spec" read the feature document.

Single-context repo: one glossary, one decisions directory. There is no `CONTEXT-MAP.md`.

## Writing the glossary

`/domain-modeling` updates `catalyst/context/domain-glossary.md` inline as terms resolve, using its `CONTEXT-FORMAT.md`. The glossary is background vocabulary, never a behavior contract — when it disagrees with a feature document or `catalyst/architecture.md`, the contract wins and the glossary catches up.

## Writing ADRs

Skills record decisions as **Catalyst decision records**, never a parallel format:

- Create one only when Catalyst's worthiness test passes (`catalyst/prime-directive.md`, Decision Records): genuinely contested, consequential, or answering a "why is it like this?" nothing else can. A resolved glossary term is usually just a glossary entry, not an ADR.
- From `catalyst/decisions/_template.md`, as `catalyst/decisions/<nnn>_<type>_<decision>.md` (next free number), target ≤4,800 characters, with the `Proposed` → `Accepted` approval flow and a row in `project-summary.md`.
- Run `python3 catalyst/tools/validate.py .` before any commit that touches documents.

## Use the glossary's vocabulary

When your output names a domain concept (in a ticket title, a spec, a hypothesis, a test name), use the term as defined in the glossary. Don't drift to synonyms it explicitly avoids. A concept the glossary lacks is a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing decision record, surface it explicitly rather than silently overriding:

> _Contradicts decision 007 (GraphQL alongside REST) — but worth reopening because…_
