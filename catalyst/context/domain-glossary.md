# Domain Glossary

A **context document** (`references/context-documents.md`): the project's domain vocabulary — terms, their agreed meanings, and the synonyms deliberately avoided. It is background language, never a contract: when a definition here disagrees with a feature document or `architecture.md`, the contract wins and this file is updated to catch up. Filled lazily by the `/domain-modeling` skill as terms actually get resolved (`agents/domain.md`); implementation detail never belongs here.

**Loads when:** naming domain concepts — writing tickets, specs, decision records, or test names — or running `/domain-modeling` or `/grill-with-docs`.

## Terms

**Change-password form** — a form mode in which the user may optionally set a new password while primarily doing something else (editing a profile or a user). Distinct from a set-password form (register, password reset), where the password is mandatory. The password pair's optionality is the defining trait, and labels and validation copy switch with it together — never independently.

**Field name** — the noun a validation message interpolates mid-sentence ("The password field must be at least 8 characters"). Not the same thing as the field label; a message must name the field the user actually sees.

**Field label** — the string rendered on or above an input ("New password"). Carries the field's name only; guidance such as "optional" belongs in a hint, never in the label. Replaces the loose use of "label" for both the visible string and the interpolated name (see Field name).
