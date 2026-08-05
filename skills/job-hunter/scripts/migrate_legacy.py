#!/usr/bin/env python3
"""Migrate legacy Job Hunter YAML without carrying its plaintext password forward."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

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
            ]
        )
    return "\n".join(lines)


def supporting_block(resources: list[str], resume_paths: list[str]) -> str:
    lines = ["  supporting:"]
    supporting = []
    normalized_resumes = {str(Path(item)) for item in resume_paths}
    for item in resources:
        if str(Path(item)) not in normalized_resumes:
            supporting.append(item)
    if not supporting:
        return "  supporting: []"
    for index, item in enumerate(supporting, start=1):
        field = "uri"
        lines.extend(
            [
                f"    - id: {quoted(f'legacy-resource-{index}')}",
                f"      {field}: {quoted(item)}",
                '      purpose: "Legacy resource; review and describe before use"',
            ]
        )
    return "\n".join(lines)


def ensure_private_gitignore(directory: Path) -> None:
    target = directory / ".gitignore"
    required = ["info.yaml", "info.yml", "info.json", "jobhunter.yaml", "jobhunter.yml", "jobhunter.json"]
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
      target_roles: []"""
    template = template.replace(old_resume, resume_block(resumes))
    old_supporting = '''  supporting:
    - id: "portfolio-notes"
      path: "./resources/portfolio-notes.md"
      purpose: "Additional verified achievements and project evidence"'''
    template = template.replace(old_supporting, supporting_block(resources, resumes))
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
    print("The legacy file remains in place and is now ignored by name. After rotation, review its backups and remove it safely yourself.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
