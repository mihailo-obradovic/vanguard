#!/usr/bin/env python3
"""Catalyst document validator.

Machine-checks document shape and cross-reference consistency, so drift does not depend on anyone remembering the rules:

  python3 tools/validate.py                      # validate the Catalyst repo itself
  python3 catalyst/tools/validate.py <project>   # validate a project spawned from it
  python3 catalyst/tools/validate.py .           # same, from inside the project
  ... --all                                      # template-check every document, not only the ones changed in the tree

Which mode runs is decided by `tools/new_project.py`: the scaffolder is never copied into a spawn, so its presence is what identifies the Catalyst repo. A project that opted into its own `VERSION` + `CHANGELOG.md` is still a project.

A spawn keeps its whole rule set in one bundle directory, `<project>/catalyst/`, so a project path is resolved to that bundle before anything is checked (`bundle_root`). Every project document lives inside it and refers to its siblings, which is why the checks below need no notion of the prefix — only `changed_docs`, which talks to git, has to translate.

Catalyst's own layout is the bundle layout with the bundle at the repository root, so the same checks read both.

Catalyst checks: `VERSION` matches the newest changelog entry (R1), `CLAUDE.md` imports `AGENTS.md` (R2), changelog shape (R3), examples follow the current templates (R4, feature/decision/experiment examples), the Flow Index in `prime-directive.md` points at exactly the `workflows/` shards that exist, every `workflows/`, `references/`, and `conventions/` shard carries its **Trigger:** header, and every `references/` and `conventions/` shard is reachable from an always-loaded document (R6), stack documents carry their contract headers — layer/tool for modules, category/tool for addon docs and payloads, `**Tier:**` for shared-tier docs, YAML `title:` frontmatter for `rules/` files (R7), the context-document catalog agrees across its four mirrors — the Catalog table, `CONTEXT_DOCS` in the scaffolder, the `templates/` stub, and the load-trigger bullet (R8), shared-tier wiring is closed both ways — every `**Requires:**` value resolves to an existing tier, every tier is required by some module (R9), the generated-skill registry (`SKILLS` in the scaffolder) points at existing documents and is mirrored in `references/agent-skills.md` (R10), the editor-extension registry (`EDITOR_EXTENSIONS`) does the same against `conventions/editor-setup.md` (R11), and the template's markdown is oxfmt-canonical — `pnpm dlx oxfmt --check` tracking `oxfmt@latest` passes, skipped with a note when pnpm is absent (R12).

Project checks (features, decision records, and experiments alike): index <-> files (P1), statuses (P2), template sections for new/changed documents only (P3, diff-aware), unique numbering (P4), Protected Areas rows point to existing documents (P5), a soft Catalyst-version drift note when the project's stamp lags (P6, note only), the size budgets (P7, diff-aware — a hard error over a feature's maximum, a note over a target), a soft note when Open Questions are not empty past the drafting gate (P8, diff-aware note), a soft note when a project with features has no operations.md (P9, note), a soft note when numbered documents exist but their folder's _template.md is not in the bundle — an unadopted flow (P10, note), and an error when a present `KNOWN_FAKES.md` holds no register rows — absence is the healthy state, an empty register is deleted, not kept (P11).

Exit code is non-zero when any error is found. Notes never block.

Stdlib only — no dependencies.
"""

from __future__ import annotations

import ast
import re
import shutil
import subprocess
import sys
from pathlib import Path

CATALYST_ROOT = Path(__file__).resolve().parent.parent

# The directory a spawn keeps its rule set in, below the project root. Kept in step with new_project.py's BUNDLE.
BUNDLE = "catalyst"

# The oxfmt the template's markdown is formatted with (R12). Tracks latest: when a new oxfmt release changes the output and the check starts failing on untouched files, rerun `pnpm dlx oxfmt@latest .` and commit the reflow.
OXFMT_VERSION = "latest"

FEATURE_STATUSES = {"Draft", "Approved", "Active", "Changing", "Deprecated", "Removed"}
EXPERIMENT_STATUSES = {"Proposed", "Running", "Adopted", "Refuted"}
DECISION_STATUSES = {"Proposed", "Accepted", "Implemented", "Superseded by"}

# Size budgets in characters — line widths are not capped (prime-directive.md, Feature Documents / Architectural Decision Records; workflows/experiments.md for experiments). Only a feature carries a hard maximum, because it is a contract others build against. A decision record and an experiment are point-in-time records held to the same target, and going over is a note.
FEATURE_CHAR_MAX = 14_400
FEATURE_CHAR_TARGET = 9_600
RECORD_CHAR_TARGET = 4_800

# Statuses that mean "past the drafting gate" — Open Questions must be empty.
_DRAFTING_STATUS = {"features": "Draft", "decisions": "Proposed", "experiments": "Proposed"}

# `## [X.Y.Z] - YYYY-MM-DD`; the date is optional so a dateless entry is still ordered (and gets a note) instead of being silently skipped. `## [Unreleased]` does not match, which is exactly right — it carries no version to order.
_ENTRY_RE = re.compile(r"^## \[(\d+\.\d+\.\d+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$")
_STAMP_RE = re.compile(r"Catalyst version:\s*(\d+\.\d+\.\d+)")

errors: list[str] = []
notes: list[str] = []


def error(message: str) -> None:
    errors.append(message)


def note(message: str) -> None:
    notes.append(message)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def is_catalyst_repo(root: Path) -> bool:
    """The scaffolder never travels into a spawn, so it identifies Catalyst."""
    return (root / "tools" / "new_project.py").is_file()


def template_sections(template: Path) -> list[str]:
    return re.findall(r"^## (.+)$", read(template), flags=re.MULTILINE)


def doc_sections(path: Path) -> set[str]:
    return set(re.findall(r"^## (.+)$", read(path), flags=re.MULTILINE))


def doc_status(path: Path) -> str | None:
    """First non-empty line under `## Status`."""
    lines = read(path).splitlines()
    for index, line in enumerate(lines):
        if line.strip() == "## Status":
            for follower in lines[index + 1 :]:
                if follower.startswith("## "):
                    return None
                if follower.strip():
                    return follower.strip()
    return None


def section_body(text: str, heading: str) -> list[str]:
    """Non-blank lines under `## <heading>`, up to the next `## `."""
    out: list[str] = []
    capture = False
    for line in text.splitlines():
        if line.startswith("## "):
            capture = line[3:].strip() == heading
            continue
        if capture and line.strip():
            out.append(line.rstrip())
    return out


def open_question_bullets(text: str) -> list[str]:
    """Real open-question bullets — excludes the `- <placeholder>` form."""
    return [
        line for line in section_body(text, "Open Questions")
        if line.lstrip().startswith("- ")
        and not re.fullmatch(r"-\s*<[^>]*>", line.strip())
    ]


def check_sections(path: Path, template: Path, label: str) -> None:
    if not template.exists():
        return
    missing = [s for s in template_sections(template) if s not in doc_sections(path)]
    if missing:
        error(f"{path}: {label} document is missing sections: {', '.join(missing)}")


def scaffolder_literal(path: Path, name: str):
    """A top-level literal assignment (`CONTEXT_DOCS`, `SKILLS`) from tools/new_project.py.

    Read rather than imported: the scaffolder is a CLI script, and importing it to inspect one list would run its module body. `ast.literal_eval` on the assignment keeps this a pure read. None when the assignment is absent or not a literal.
    """
    if not path.is_file():
        return None
    try:
        tree = ast.parse(read(path))
    except SyntaxError:
        return None
    for node in tree.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(t, ast.Name) and t.id == name for t in node.targets):
            continue
        try:
            return ast.literal_eval(node.value)
        except ValueError:
            return None
    return None


def scaffolder_context_docs(path: Path) -> dict[str, bool] | None:
    """`CONTEXT_DOCS` from tools/new_project.py as name -> scaffold default."""
    entries = scaffolder_literal(path, "CONTEXT_DOCS")
    if entries is None:
        return None
    try:
        return {entry["name"]: bool(entry["default"]) for entry in entries}
    except (TypeError, KeyError):
        return None


def catalog_defaults(text: str) -> dict[str, bool]:
    """The Catalog table of references/context-documents.md as name -> scaffold default (`on`/`off`)."""
    rows: dict[str, bool] = {}
    in_section = False
    for line in text.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == "## Catalog"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        name = re.fullmatch(r"`([^`]+)`", cells[0])  # skips the header and separator rows
        if name and cells[1] in ("on", "off"):
            rows[name.group(1)] = cells[1] == "on"
    return rows


# --- Catalyst checks ---------------------------------------------------------


def check_catalyst(root: Path) -> None:
    changelog = read(root / "CHANGELOG.md")
    entries = []
    for line in changelog.splitlines():
        m = _ENTRY_RE.match(line)
        if m:
            entries.append((tuple(int(p) for p in m.group(1).split(".")), m.group(1), m.group(2)))

    # R1: VERSION == the newest changelog entry. The number lives in VERSION (versioning.md); releasing moves the two together.
    declared = read(root / "VERSION").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", declared):
        error(f"VERSION: {declared!r} is not a MAJOR.MINOR.PATCH version")
    elif not entries:
        error("CHANGELOG.md: no version entries found")
    elif declared != entries[0][1]:
        error(
            f"version mismatch: VERSION says {declared}, newest CHANGELOG entry is {entries[0][1]}"
        )

    # R2: CLAUDE.md is an import of AGENTS.md, not a copy of it — one entry document, reachable under both names.
    if "@AGENTS.md" not in read(root / "CLAUDE.md"):
        error("CLAUDE.md: does not import AGENTS.md (expected an `@AGENTS.md` line)")

    # R3: changelog entries strictly descending, each one dated.
    for newer, older in zip(entries, entries[1:]):
        if newer[0] <= older[0]:
            error(
                f"CHANGELOG.md: version {newer[1]} is not greater than the entry below it ({older[1]})"
            )
    for _, version, date in entries:
        if date is None:
            note(f"CHANGELOG.md: entry [{version}] has no `- YYYY-MM-DD` date")

    # R4: examples follow the current templates.
    for folder, template in (
        ("features", "features/_template.md"),
        ("decisions", "decisions/_template.md"),
        ("experiments", "experiments/_template.md"),
    ):
        for path in sorted((root / "examples" / folder).glob("[0-9]*.md")):
            check_sections(path, root / template, f"example {folder.rstrip('s')}")

    # R7: stack documents carry their contract headers, classified by path, most specific first. A file under a `rules/` dir is a vendored performance rule and carries YAML frontmatter with a `title:` (a missing `impact:` is a note — upstream omits it occasionally). A doc under an `addons/` dir — the addon itself or its payload dir — carries **Category:** (its grouping at spawn) + **Tool:**. A doc inside a shared tier (any `_`-prefixed path component, e.g. stacks/_lang/typescript/ or stacks/frontend/_react/) carries **Tier:** — tiers span layers, so Layer/Tool would say the wrong thing. Everything else is a module or choice doc and carries **Layer:** + **Tool:**.
    for path in sorted((root / "stacks").rglob("*.md")):
        text = read(path)
        parents = path.relative_to(root / "stacks").parts[:-1]
        if "rules" in parents:
            m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
            if not m or not re.search(r"^title:", m.group(1), re.MULTILINE):
                error(f"{path}: rule file is missing YAML frontmatter with a `title:`")
            elif not re.search(r"^impact:", m.group(1), re.MULTILINE):
                note(f"{path}: rule frontmatter has no `impact:`")
            continue
        if "addons" in parents:
            labels = ("**Category:**", "**Tool:**")
        elif any(part.startswith("_") for part in parents):
            labels = ("**Tier:**",)
        else:
            labels = ("**Layer:**", "**Tool:**")
        for label in labels:
            if label not in text:
                error(f"{path}: stack document is missing {label}")

    # R9: shared-tier wiring parity, both directions. A `**Requires:**` header (same regex as REQUIRES_TIERS_RE in tools/new_project.py — keep them identical) must name existing tier directories, or a spawn would report a build-out gap; a tier directory holding documents that no module requires would never travel into any spawn, so it is dead weight the moment it drifts.
    stacks_root = root / "stacks"
    if stacks_root.is_dir():
        required: set[str] = set()
        for path in sorted(stacks_root.rglob("*.md")):
            for m in re.finditer(r"^\*\*Requires:\*\*\s*(.+)$", read(path), re.MULTILINE):
                for part in re.split(r"[·,]", m.group(1)):
                    tier = part.strip()
                    if not tier:
                        continue
                    required.add(tier)
                    if not (stacks_root / tier).is_dir():
                        error(f"{path}: **Requires:** names stacks/{tier}, which does not exist")
                    elif not any(seg.startswith("_") for seg in Path(tier).parts):
                        error(f"{path}: **Requires:** names stacks/{tier}, which is not a shared tier (no `_`-prefixed path component)")
        for tier_dir in sorted(p for p in stacks_root.rglob("*") if p.is_dir()):
            rel_parts = tier_dir.relative_to(stacks_root).parts
            if not any(seg.startswith("_") for seg in rel_parts):
                continue
            if not any(child.is_file() and child.suffix == ".md" for child in tier_dir.iterdir()):
                continue  # a grouping dir like stacks/_lang/ holds tiers, not documents
            rel = "/".join(rel_parts)
            if not any(rel == r or rel.startswith(r + "/") for r in required):
                error(f"stacks/{rel}: shared-tier directory is required by no module's **Requires:** header — it would never travel into a spawn")

    # R6: the Flow Index in prime-directive.md points at exactly the workflows/ shards that exist (both directions), every workflows/ and references/ shard carries its **Trigger:** header, and every references/ shard is pointed at from an always-loaded document — the step detail lives in one place, reachable from the always-loaded core.
    for folder in ("workflows", "references", "conventions"):
        for path in sorted((root / folder).glob("*.md")):
            if "**Trigger:**" not in read(path):
                error(f"{path}: shard document is missing **Trigger:**")
    prime = read(root / "prime-directive.md")
    workflows_built = (root / "workflows").is_dir()
    workflow_files = {p.name for p in (root / "workflows").glob("*.md")}
    linked = set(re.findall(r"\(workflows/([^)]+\.md)\)", prime))
    for orphan in sorted(workflow_files - linked):
        error(f"workflows/{orphan}: exists but no Flow Index row in prime-directive.md points to it")
    for dead in sorted(linked - workflow_files):
        # A Flow Index row pointing into a directory that does not exist at all is a known build-out gap (TODO.md), not drift — the same tolerance every other check gives an absent directory. Once workflows/ lands, a dead link means a real broken reference.
        report = error if workflows_built else note
        report(f"prime-directive.md: Flow Index points to missing file workflows/{dead}")
    # references/ and conventions/ shards are reachable the same way — pointed at from an always-loaded document, so "not preloaded" is still findable. A conventions/ document binds every project whatever its stack, which makes an unreachable one worse than a stray reference shard: it ships into every spawn and is read by nobody.
    always_loaded = "\n".join(
        read(root / name)
        for name in ("AGENTS.md", "prime-directive.md", "architecture.md", "project-summary.md")
        if (root / name).exists()
    )
    for folder in ("references", "conventions"):
        for path in sorted((root / folder).glob("*.md")):
            if f"{folder}/{path.name}" not in always_loaded:
                error(f"{folder}/{path.name}: exists but no always-loaded document points to it")

    # R8: the context-document catalog is mirrored in four places (references/context-documents.md, "Adding a context document") — the Catalog table, CONTEXT_DOCS in the scaffolder, a templates/<name>.md stub, and a load-trigger bullet in prime-directive.md. Drift is invisible otherwise: a default that disagrees silently changes what every spawn ships.
    catalog_path = root / "references" / "context-documents.md"
    if catalog_path.exists():
        catalog = catalog_defaults(read(catalog_path))
        scaffolder = scaffolder_context_docs(root / "tools" / "new_project.py")
        if scaffolder is None:
            error("tools/new_project.py: CONTEXT_DOCS not found or not a literal list — references/context-documents.md's Catalog cannot be checked for parity")
        else:
            for name in sorted(set(catalog) - set(scaffolder)):
                error(f"references/context-documents.md: Catalog lists `{name}` but CONTEXT_DOCS in tools/new_project.py does not — a spawn never offers it")
            for name in sorted(set(scaffolder) - set(catalog)):
                error(f"tools/new_project.py: CONTEXT_DOCS has `{name}` but the Catalog in references/context-documents.md has no row for it")
            for name in sorted(set(catalog) & set(scaffolder)):
                if catalog[name] != scaffolder[name]:
                    error(f"context document `{name}`: the Catalog says {'on' if catalog[name] else 'off'} but CONTEXT_DOCS says default={scaffolder[name]}")
            for name in sorted(set(catalog) | set(scaffolder)):
                if not (root / "templates" / f"{name}.md").is_file():
                    error(f"templates/{name}.md: context document `{name}` has no template stub — a spawn that opts into it would copy nothing")
                # Soft: a stale load trigger changes nothing a spawn ships, but the document is then loaded by no rule.
                if f"context/{name}.md" not in prime:
                    note(f"prime-directive.md: no Context Loading bullet for `context/{name}.md` — the document would be copied but never loaded")

    # R10: generated-skill parity. Every SKILLS entry in the scaffolder must point at documents the template actually has — a `needs` path that does not exist means the wrapper can never be generated, a `points_at` path that does not exist is a pointer into nothing — and every skill must be named in references/agent-skills.md, so the wrapper mechanism stays documented alongside its inventory.
    skills = scaffolder_literal(root / "tools" / "new_project.py", "SKILLS")
    skills_shard = root / "references" / "agent-skills.md"
    if skills is None:
        error("tools/new_project.py: SKILLS not found or not a literal list — generated skill wrappers cannot be checked (R10)")
    else:
        shard_text = read(skills_shard) if skills_shard.is_file() else ""
        if not skills_shard.is_file():
            error("references/agent-skills.md: missing, but the scaffolder defines SKILLS — the wrapper mechanism would be documented nowhere")
        for skill in skills:
            name = skill.get("name", "<unnamed>")
            for rel in list(skill.get("needs", ())) + list(skill.get("points_at", ())):
                if not (root / rel).exists():
                    error(f"tools/new_project.py: SKILLS `{name}` references {rel}, which does not exist in the template")
            if shard_text and f"`{name}`" not in shard_text:
                error(f"references/agent-skills.md: generated skill `{name}` is not mentioned — list every wrapper the scaffolder can generate")

    # R11: editor-extension parity, the same two directions R10 checks for skills. A `needs` path that does not exist gates the entry off forever — the extension would silently never be recommended — and an entry absent from conventions/editor-setup.md means the generated .vscode/extensions.json carries a recommendation the documents never explain. Both drift silently: the spawn still succeeds and nothing points at the gap.
    extensions = scaffolder_literal(root / "tools" / "new_project.py", "EDITOR_EXTENSIONS")
    setup_shard = root / "conventions" / "editor-setup.md"
    if extensions is None:
        error("tools/new_project.py: EDITOR_EXTENSIONS not found or not a literal list — the generated .vscode/extensions.json cannot be checked (R11)")
    else:
        setup_text = read(setup_shard) if setup_shard.is_file() else ""
        if not setup_shard.is_file():
            error("conventions/editor-setup.md: missing, but the scaffolder defines EDITOR_EXTENSIONS — the extension set would be documented nowhere")
        for ext in extensions:
            ident = ext.get("id", "<unnamed>")
            for rel in ext.get("needs", ()):
                if not (root / rel).exists():
                    error(f"tools/new_project.py: EDITOR_EXTENSIONS `{ident}` needs {rel}, which does not exist in the template — the extension could never be recommended")
            if setup_text and f"`{ident}`" not in setup_text:
                error(f"conventions/editor-setup.md: recommended extension `{ident}` is not in the table — every generated recommendation is documented")

    # R12: the template's markdown is oxfmt-canonical (stacks/_lang/typescript/toolchain.md) — spawns format their whole repository, so any drift here comes back as merge churn on every upgrade. The vendored rules/ payloads are covered too; sync_rules.py normalizes upstream through oxfmt before comparing. Template mode only: a spawn's own `format:check` script already owns this. pnpm is the one non-stdlib need, so its absence is a note, never an error.
    if shutil.which("pnpm") is None:
        note("oxfmt check skipped — pnpm is not on PATH (R12)")
    else:
        fmt = subprocess.run(
            ["pnpm", "dlx", f"oxfmt@{OXFMT_VERSION}", "--check", "."],
            cwd=root,
            capture_output=True,
            text=True,
        )
        if fmt.returncode != 0:
            detail = (fmt.stdout + fmt.stderr).strip()
            error(f"markdown is not oxfmt-formatted — run `pnpm dlx oxfmt@{OXFMT_VERSION} .` (R12)\n{detail}")


# --- project checks ----------------------------------------------------------


def index_rows(summary: str, heading: str, folder: str, status_col: int) -> dict[str, str]:
    """Links -> status from the table under `heading` (repo-relative link)."""
    rows: dict[str, str] = {}
    in_section = False
    for line in summary.splitlines():
        if line.startswith("## "):
            in_section = line.strip() == f"## {heading}"
            continue
        if not in_section or not line.strip().startswith("|"):
            continue
        link = re.search(rf"\]\(({folder}/[^)]+\.md)\)", line)
        if not link:
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        status = cells[status_col] if len(cells) > status_col else ""
        rows[link.group(1)] = status
    return rows


def changed_docs(project: Path) -> set[str] | None:
    """Bundle-relative paths of new/changed .md docs; None when git is absent.

    `git status --porcelain` always reports paths from the repository root, while every caller compares against paths relative to the bundle. In a spawn those differ by the `catalyst/` prefix, so it is stripped here — without that, the diff-aware checks (P3, P7, P8) would match nothing and silently pass everything.
    """
    try:
        result = subprocess.run(
            ["git", "-C", str(project), "status", "--porcelain"],
            capture_output=True,
            text=True,
            check=True,
        )
        top = subprocess.run(
            ["git", "-C", str(project), "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None
    try:
        prefix = project.resolve().relative_to(Path(top).resolve())
    except ValueError:
        prefix = Path(".")
    changed: set[str] = set()
    for line in result.stdout.splitlines():
        path = line[3:].split(" -> ")[-1].strip().strip('"')
        if not path.endswith(".md"):
            continue
        try:  # outside the bundle (the project's own code and docs) — not ours to check
            changed.add(Path(path).relative_to(prefix).as_posix())
        except ValueError:
            continue
    return changed


def check_project(project: Path, check_all: bool) -> None:
    summary_path = project / "project-summary.md"
    if not summary_path.exists():
        error(f"{project}: project-summary.md not found — is this a project root?")
        return
    summary = read(summary_path)

    # Templates resolve against the project's own bundle, not CATALYST_ROOT — run from the Catalyst repo against a project path, the repo's always-present templates would mask an unadopted flow (P10) and check documents against a template the project does not carry (P3).
    plans = [
        ("Feature Index", "features", 2, FEATURE_STATUSES,
         project / "features" / "_template.md"),
        ("Architecture Decision Record (ADR) Index", "decisions", 2,
         DECISION_STATUSES, project / "decisions" / "_template.md"),
        ("Experiment Index", "experiments", 3, EXPERIMENT_STATUSES,
         project / "experiments" / "_template.md"),
    ]
    changed = changed_docs(project)
    if changed is None and not check_all:
        note(f"{project}: not a git repo — diff-aware checks (P3, P7, P8) skipped")

    for heading, folder, status_col, allowed, template in plans:
        indexed = index_rows(summary, heading, folder, status_col)
        on_disk = {
            f"{folder}/{path.name}"
            for path in (project / folder).glob("[0-9]*.md")
        }

        # P10: documents without their template in the bundle — an unadopted flow (experiments are opt-in at spawn).
        if on_disk and not template.exists():
            note(f"{project}/{folder}: documents exist but the bundle has no {folder}/_template.md — from the Catalyst repo, tools/upgrade_project.py --apply offers adopting the flow")

        # P1: index <-> files, both directions.
        for missing_row in sorted(on_disk - set(indexed)):
            error(f"{project}/{missing_row}: exists but has no row in {heading}")
        for dead_link in sorted(set(indexed) - on_disk):
            error(f"{project}/project-summary.md: {heading} links missing file {dead_link}")

        # P4: unique numbering.
        seen: dict[str, str] = {}
        for rel in sorted(on_disk):
            number = Path(rel).name.split("_")[0]
            if number in seen:
                error(f"{project}/{folder}: number {number} used by both {seen[number]} and {Path(rel).name}")
            seen[number] = Path(rel).name

        for rel in sorted(on_disk & set(indexed)):
            path = project / rel
            # P2: status in the document == status in the index.
            status = doc_status(path)
            if status is None:
                error(f"{path}: no `## Status` section with a value")
            else:
                # "Superseded by <nnn>" is a valid decision status prefix.
                token = ("Superseded by" if status.startswith("Superseded by")
                         else status)
                if allowed and token not in allowed:
                    error(f"{path}: status '{status}' is not one of {sorted(allowed)}")
                if indexed[rel] and status != indexed[rel]:
                    error(f"{path}: status '{status}' but the index row says '{indexed[rel]}'")
            # Diff-aware checks — new/changed docs only (or --all), so older documents are aligned on their next substantive edit, never retroactively (same rule as P3).
            if check_all or (changed is not None and rel in changed):
                # P3: template sections.
                check_sections(path, template, folder.rstrip("s"))
                text = read(path)
                # P7: size budgets, in characters (line widths are not capped).
                if folder == "features":
                    n = len(text)
                    if n > FEATURE_CHAR_MAX:
                        error(f"{path}: {n} characters, over the {FEATURE_CHAR_MAX} hard maximum — split the feature or move exhaustive examples into tests")
                    elif n > FEATURE_CHAR_TARGET:
                        note(f"{path}: {n} characters, over the {FEATURE_CHAR_TARGET} target — consider summarizing implementation detail")
                elif folder in ("decisions", "experiments"):
                    n = len(text)
                    if n > RECORD_CHAR_TARGET:
                        hint = ("a record keeps the why, not the rules it points at" if folder == "decisions"
                                else "an experiment is a probe, not a report")
                        note(f"{path}: {n} characters, over the {RECORD_CHAR_TARGET} target — {hint}")
                # P8 (soft): Open Questions must be empty past the drafting gate. The resolution target differs by document type (features have Non-Goals; decisions fold into Consequences; experiments have neither), so the hint is folder-aware.
                if status and status != _DRAFTING_STATUS.get(folder):
                    if open_question_bullets(text):
                        hint = {
                            "features": "resolve each or move it to Non-Goals",
                            "decisions": "resolve each or fold it into Consequences",
                            "experiments": "resolve each before the run",
                        }.get(folder, "resolve each")
                        note(f"{path}: status '{status}' but Open Questions still has entries — {hint} (brownfield may keep them deliberately)")

    # P5: pointer indexes (Protected Areas) point at existing documents. They hold pointers only (owning docs keep the rules); completeness is the Same-Change Rule's job, link validity is checked here.
    pointer_sections = ("Protected Areas",)
    current = None
    for line in summary.splitlines():
        if line.startswith("## "):
            heading = line.removeprefix("## ").strip()
            current = heading if heading in pointer_sections else None
            continue
        if current is None:
            continue
        for target in re.findall(
            r"`?((?:features|decisions)/[^)`|]+\.md)`?", line
        ):
            if not (project / target).exists():
                error(
                    f"{project}/project-summary.md: {current} points to missing file {target}"
                )

    # P6 (soft): the project's Catalyst version stamp vs the current Catalyst version. This tracks document-shape drift only — always a note, never an error (Spawning Projects, prime-directive.md). Gated on actually running from Catalyst: a project that versions itself has its own VERSION, and comparing that product version against the stamp would be meaningless.
    if is_catalyst_repo(CATALYST_ROOT) and (CATALYST_ROOT / "VERSION").exists():
        current_version = read(CATALYST_ROOT / "VERSION").strip()
        stamp = _STAMP_RE.search(summary)
        if not re.fullmatch(r"\d+\.\d+\.\d+", current_version):
            pass
        elif not stamp:
            note(f"{project}: project-summary.md has no 'Catalyst version: X.Y.Z' stamp — add one to track alignment with Catalyst")
        else:
            cat_v = tuple(int(p) for p in current_version.split("."))
            st_v = tuple(int(p) for p in stamp.group(1).split("."))
            if st_v < cat_v:
                note(f"{project}: aligned to Catalyst {stamp.group(1)}, current is {current_version} — review CHANGELOG entries newer than {stamp.group(1)} and adopt what applies")

    # P9 (soft): a project with real features but no operator runbook. A project with stateful infrastructure keeps `operations.md` (Operations Runbook); this reminds, never blocks — a purely stateless project can ignore it.
    has_features = any((project / "features").glob("[0-9]*.md"))
    if has_features and not (project / "operations.md").exists():
        note(f"{project}: no operations.md — a project with stateful infrastructure keeps an operator runbook (Operations Runbook)")

    # P11: a present KNOWN_FAKES.md holds at least one register row. Absence is the healthy state (Honest Inputs), so nothing is said when the file is missing — but present-and-empty misreads as attestation, and the rule is to delete the file with the last fake, so that is an error.
    fakes = project / "KNOWN_FAKES.md"
    if fakes.exists():
        pipe_lines = [ln.strip() for ln in read(fakes).splitlines() if ln.strip().startswith("|")]
        rows = [ln for ln in pipe_lines if not re.fullmatch(r"\|(?:\s*:?-+:?\s*\|)+", ln)]
        if len(rows) < 2:  # header only, or no table at all
            error(f"{project}/KNOWN_FAKES.md: register has no entries — delete the file when the last fake is removed (Known Fakes Register)")


def bundle_root(path: Path) -> Path:
    """The directory holding a project's rule set: <path>/catalyst/, or <path> itself.

    A project's repository root and its bundle are both natural ways to name the project, so both are accepted.
    """
    nested = path / BUNDLE
    return nested if nested.is_dir() else path


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--all"]
    check_all = "--all" in sys.argv[1:]
    if args:
        check_project(bundle_root(Path(args[0]).resolve()), check_all)
    elif is_catalyst_repo(CATALYST_ROOT):
        check_catalyst(CATALYST_ROOT)
    else:
        # Run with no args outside Catalyst — a spawned project carrying the validator. `tools/new_project.py` never travels into a spawn, so its absence is what tells the two apart. Say what to do instead of running Catalyst's own checks against a project.
        error("this is not the Catalyst repo (it has no tools/new_project.py); pass a project path (e.g. `validate.py .`) to validate a project")

    for line in notes:
        print(f"note: {line}")
    for line in errors:
        print(f"ERROR: {line}")
    print(f"validate: {len(errors)} error(s), {len(notes)} note(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
