#!/usr/bin/env python3
"""Migrate legacy Job Hunter YAML without carrying its plaintext password forward."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

from profile_io import ProfileParseError, load_profile


SCRIPT_DIR = Path(__file__).resolve().parent
TEMPLATE = SCRIPT_DIR.parent / "assets" / "jobhunter.project.yaml"


def quoted(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def resume_block(candidates: list[str]) -> str:
    lines = ["  resumes:"]
    for index, resource in enumerate(candidates):
        resource_path = resource if resource.startswith(("/", "./", "../", "~")) else f"./{resource}"
        lines.extend(
            [
                f"    - id: {quoted('default' if index == 0 else f'resume-{index + 1}')}",
                f"      path: {quoted(resource_path)}",
                f"      default: {'true' if index == 0 else 'false'}",
                "      target_roles: []",
                "      share_with_employers: true",
            ]
        )
    return "\n".join(lines)


def split_resources(resources: list[str], resume_paths: list[str], source: Path) -> tuple[list[str], list[str]]:
    local: list[str] = []
    online: list[str] = []
    normalized_resumes = set()
    for item in resume_paths:
        path = Path(item).expanduser()
        normalized_resumes.add((path if path.is_absolute() else source.parent / path).resolve())
    for item in resources:
        parsed = urlparse(item)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            online.append(item)
            continue
        path = Path(item).expanduser()
        resolved = (path if path.is_absolute() else source.parent / path).resolve()
        if resolved not in normalized_resumes:
            local.append(item)
    return local, online


def local_block(resources: list[str]) -> str:
    if not resources:
        return "  local: []"
    lines = ["  local:"]
    for index, item in enumerate(resources, start=1):
        resource_path = item if item.startswith(("/", "./", "../", "~")) else f"./{item}"
        lines.extend(
            [
                f"    - id: {quoted(f'legacy-local-{index}')}",
                '      type: "supporting-document"',
                f"      path: {quoted(resource_path)}",
                '      use_for: ["candidate-evidence"]',
                "      share_with_employers: false",
            ]
        )
    return "\n".join(lines)


def online_block(resources: list[str]) -> str:
    if not resources:
        return "  online: []"
    lines = ["  online:"]
    for index, item in enumerate(resources, start=1):
        lines.extend(
            [
                f"    - id: {quoted(f'legacy-online-{index}')}",
                '      type: "professional-resource"',
                f"      uri: {quoted(item)}",
                '      access_mode: "user-provided"',
                '      use_for: ["candidate-evidence"]',
                "      share_with_employers: false",
            ]
        )
    return "\n".join(lines)


def ensure_private_gitignore(directory: Path) -> None:
    target = directory / ".gitignore"
    required = [
        "info.yaml",
        "info.yml",
        "info.json",
        "jobhunter.yaml",
        "jobhunter.yml",
        "jobhunter.json",
        "jobhunter-actions.csv",
        "jobhunter-actions.csv.lock",
    ]
    current = target.read_text(encoding="utf-8") if target.exists() else ""
    existing = current.splitlines()
    missing = [entry for entry in required if entry not in existing]
    if missing:
        separator = "" if not current or current.endswith("\n") else "\n"
        target.write_text(f"{current}{separator}\n# Job Hunter private profiles\n" + "\n".join(missing) + "\n", encoding="utf-8")


def migrate(source: Path, output: Path, resumes: list[str]) -> None:
    profile, _ = load_profile(source)
    credentials = profile.get("default-credentials", profile.get("default"))
    resources = profile.get("profile-resources", [])
    if not isinstance(credentials, list) or not credentials or not isinstance(credentials[0], str):
        raise ValueError("Legacy profile must contain default-credentials with an email as its first item.")
    if not isinstance(resources, list) or any(not isinstance(item, str) for item in resources):
        raise ValueError("Legacy profile must contain profile-resources as a list of paths.")
    if not resumes:
        raise ValueError("Specify at least one candidate-approved resume with --resume; migration never guesses from nearby files.")
    for resume in resumes:
        resume_path = Path(resume).expanduser()
        resolved = resume_path if resume_path.is_absolute() else source.parent / resume_path
        if not resolved.is_file():
            raise ValueError("A --resume path does not exist or is not a file.")
    if output.exists():
        raise FileExistsError(f"Refusing to overwrite existing path: {output}")

    template = TEMPLATE.read_text(encoding="utf-8")
    template = template.replace("primary_email: null", f"primary_email: {quoted(credentials[0])}")
    template = template.replace("    email: null", f"    email: {quoted(credentials[0])}", 1)
    old_resume = """  resumes:
    - id: "default"
      path: "./resumes/resume.pdf"
      default: true
      target_roles: []
      share_with_employers: true"""
    template = template.replace(old_resume, resume_block(resumes))
    local_resources, online_resources = split_resources(resources, resumes, source)
    template = template.replace("  local: []", local_block(local_resources), 1)
    template = template.replace("  online: []", online_block(online_resources), 1)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(template, encoding="utf-8")
    ensure_private_gitignore(output.parent)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("legacy_profile", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--resume", action="append", default=[], help="Candidate-approved resume path; repeat for variants")
    args = parser.parse_args()
    try:
        migrate(args.legacy_profile.expanduser().resolve(), args.output.expanduser().resolve(), args.resume)
    except (OSError, ValueError, ProfileParseError) as error:
        print(str(error))
        return 1
    print(f"Created {args.output.expanduser().resolve()}")
    print("The legacy password was not copied. Rotate it and configure a credential reference or browser session.")
    print("Complete Job Hunter onboarding to confirm resource uses, target markets, and country-specific eligibility.")
    print("The legacy file remains in place and is now ignored by name. After rotation, review its backups and remove it safely yourself.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
