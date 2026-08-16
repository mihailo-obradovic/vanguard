# Triage Labels

The skills speak in terms of five canonical triage roles. Workflowy has no native labels, so each role maps to an inline hashtag appended to the node's name (see `issue-tracker.md`).

| Label in mattpocock/skills | Hashtag in Workflowy | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `#needs-triage`      | Maintainer needs to evaluate this issue  |
| `needs-info`               | `#needs-info`        | Waiting on reporter for more information |
| `ready-for-agent`          | `#ready-for-agent`   | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `#ready-for-human`   | Requires human implementation            |
| `wontfix`                  | `#wontfix`           | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), rename the node (`workflowy_update`) so it carries exactly one of these hashtags — replace the previous role hashtag, keep every other hashtag (`#high-priority`, `#back-end`, …) intact.

Triage applies only to issues the user did not author through `/to-tickets`; those arrive agent-ready.
