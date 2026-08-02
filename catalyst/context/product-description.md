# Product Description

A **context document** (`references/context-documents.md`): background depth behind the one-paragraph purpose in `project-summary.md`. It records product vision and intent — _not_ behavior. It is never a contract: when it disagrees with a feature document or `architecture.md`, the contract wins and this file is updated to catch up. Keep it scannable; trim to what shapes decisions and link out for the rest.

**Loads when:** product-shaping work — drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or any task touching product scope, phases, or priorities.

## Vision

The problem this product solves and the outcome it aims for, in a few sentences. Why it is worth building.

## Users

Who uses it and what each type is trying to accomplish. Note distinct user groups when they want different things.

## Scope And Non-Goals

In scope:

- <capability the product does provide>

Non-goals:

- <capability deliberately out of scope — and, briefly, why>

## Phases And Priorities

The order in which capabilities are built and why — what ships first, what waits. Highlight what is load-bearing versus nice-to-have.

| Phase   | Focus              | Priority                |
| ------- | ------------------ | ----------------------- |
| <phase> | <what it delivers> | <must / should / later> |

## Key Integrations

External systems, data sources, or platforms the product depends on or must fit into.

- `<system>`: <what it provides and why it matters>

## Success Signals

How you will know the product is working — the outcomes or metrics that matter (not implementation detail).

- <signal>
