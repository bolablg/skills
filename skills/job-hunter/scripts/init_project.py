#!/usr/bin/env python3
"""Create a private Job Hunter workspace from the bundled templates."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
ASSETS = SCRIPT_DIR.parent / "assets"


def copy_new(source: Path, target: Path) -> None:
    if target.exists():
        raise FileExistsError(f"Refusing to overwrite existing path: {target}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def initialize(project: Path) -> list[Path]:
    project = project.expanduser().resolve()
    mapping = {
        "jobhunter.project.yaml": project / "jobhunter.yaml",
        "job-candidates.csv": project / "jobhunter-ledger" / "job-candidates.csv",
        "application-ledger.csv": project / "jobhunter-ledger" / "applications.csv",
        "recruiter-ledger.csv": project / "jobhunter-ledger" / "recruiters.csv",
        "candidate-evidence-template.md": project / "jobhunter-ledger" / "candidate-evidence.md",
        "jobhunter-actions.csv": project / "jobhunter-actions.csv",
    }
    existing = [target for target in mapping.values() if target.exists()]
    if existing:
        raise FileExistsError(f"Refusing to overwrite existing path: {existing[0]}")

    project.mkdir(parents=True, exist_ok=True)
    created: list[Path] = []
    for asset, target in mapping.items():
        copy_new(ASSETS / asset, target)
        created.append(target)
    ignore_target = project / ".gitignore"
    ignore_lines = (ASSETS / "project-gitignore.txt").read_text(encoding="utf-8").splitlines()
    if ignore_target.exists():
        current = ignore_target.read_text(encoding="utf-8")
        missing = [line for line in ignore_lines if line and line not in current.splitlines()]
        if missing:
            separator = "" if not current or current.endswith("\n") else "\n"
            ignore_target.write_text(f"{current}{separator}\n# Job Hunter private files\n" + "\n".join(missing) + "\n", encoding="utf-8")
    else:
        copy_new(ASSETS / "project-gitignore.txt", ignore_target)
    created.append(ignore_target)
    for directory in ("resumes", "resources", "sessions", "generated"):
        target = project / directory
        target.mkdir(exist_ok=True)
        created.append(target)
    return created


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path)
    args = parser.parse_args()
    try:
        created = initialize(args.project)
    except FileExistsError as error:
        print(str(error))
        return 1
    print("Created Job Hunter workspace:")
    for path in created:
        print(path)
    print("Start Job Hunter onboarding, select at least one resume, then validate jobhunter.yaml.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
