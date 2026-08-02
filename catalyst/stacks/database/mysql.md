# Stack: Database — MySQL

**Layer:** Database
**Tool:** MySQL

The alternative database module — PostgreSQL is the default; MySQL is picked when the environment decides for you (existing infrastructure, a hosting constraint, a team standard). It only names the tool — the persistence rules (versioned forward-only migrations, transaction boundaries, database-enforced invariants, tested backups) are Universal Rules and are not restated here.

- MySQL is the operational database, and InnoDB is the only storage engine in play — the persistence Universal Rules (transactions, row-level locking, foreign-key constraints) assume it; MyISAM has no place in a spawned project.
- Character set is `utf8mb4` everywhere — MySQL's legacy `utf8` is a three-byte trap, not UTF-8.
- The migration *tool* lives with the backend language, not here: the pairing table below names it per backend. A different backend module brings its own migration tool against the same MySQL.
- Integration tests run against a real MySQL, never a SQLite stand-in (Testing, Universal Rules); the backend module names the test harness.
- Time-series or extension-shaped needs are a reason to take the PostgreSQL default instead — MySQL has no Timescale equivalent.

## Backend Pairings

The engine stays language-neutral; the language-side pairing lives here so the chosen backend has a documented set. One row per backend module that exists — a new backend module adds its row when it lands.

| Backend | Client | Migration tool | Test harness |
| --- | --- | --- | --- |
| `python-fastapi` | SQLAlchemy (`PyMySQL` driver) | Alembic | `pytest` + `testcontainers` |

## Approved Libraries

- MySQL.
