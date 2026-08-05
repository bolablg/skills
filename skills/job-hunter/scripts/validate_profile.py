#!/usr/bin/env python3
"""Validate a Job Hunter YAML or JSON project profile without exposing secrets."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from profile_io import ProfileParseError, load_profile


ALLOWED_SECRET_SOURCES = {"prompt", "env", "macos-keychain", "secret-manager", "browser-session"}
ALLOWED_APPLICATION_MODES = {"prepare-only", "review-each", "approved-batch"}
ALLOWED_ACCOUNT_MODES = {"disabled", "ask-each", "approved-domains"}
ALLOWED_OUTREACH_MODES = {"draft-only", "review-each", "approved-batch"}
ALLOWED_FUNCTIONS = {"apply", "recruiter-outreach"}
SENSITIVE_KEY = re.compile(r"(?:password|passwd|secret|token|api[_-]?key|private[_-]?key)", re.I)


def _mapping(value: Any, path: str, errors: list[str]) -> dict[str, Any]:
    if not isinstance(value, dict):
        errors.append(f"{path} must be an object/mapping.")
        return {}
    return value


def _required(mapping: dict[str, Any], path: str, fields: tuple[str, ...], errors: list[str]) -> None:
    for field in fields:
        if field not in mapping or mapping[field] in (None, "", []):
            errors.append(f"Missing required field: {path}.{field}")


def _lists(mapping: dict[str, Any], path: str, fields: tuple[str, ...], errors: list[str]) -> None:
    for field in fields:
        value = mapping.get(field)
        if not isinstance(value, list) or not value:
            errors.append(f"{path}.{field} must be a non-empty list.")


def _scan_plaintext_secrets(value: Any, path: str, errors: list[str]) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}" if path else str(key)
            if SENSITIVE_KEY.search(str(key)) and not isinstance(child, dict):
                errors.append(f"Plaintext secret-like field is forbidden: {child_path}")
            _scan_plaintext_secrets(child, child_path, errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _scan_plaintext_secrets(child, f"{path}[{index}]", errors)


def _validate_credential(value: Any, path: str, errors: list[str]) -> None:
    credential = _mapping(value, path, errors)
    source = credential.get("source")
    if source not in ALLOWED_SECRET_SOURCES:
        errors.append(f"{path}.source must be one of: {', '.join(sorted(ALLOWED_SECRET_SOURCES))}.")
    if source in {"env", "macos-keychain", "secret-manager"} and not credential.get("ref"):
        errors.append(f"{path}.ref is required for source {source!r}.")
    for key in credential:
        if key not in {"source", "ref"}:
            errors.append(f"Unsupported credential field: {path}.{key}")


def _resolve(profile_path: Path, raw_path: str) -> Path:
    candidate = Path(raw_path).expanduser()
    return candidate if candidate.is_absolute() else (profile_path.parent / candidate).resolve()


def validate(profile_path: Path, mode: str) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        profile, format_name = load_profile(profile_path)
    except FileNotFoundError:
        return ["Profile file does not exist."], warnings, {}
    except (OSError, ProfileParseError) as error:
        return [error.__class__.__name__ if isinstance(error, OSError) else str(error)], warnings, {}

    legacy_credentials = profile.get("default-credentials", profile.get("default"))
    if isinstance(legacy_credentials, list):
        errors.append(
            "Legacy default credential arrays are unsafe. Run migrate_legacy.py, rotate the password, and use a credential reference."
        )

    _scan_plaintext_secrets(profile, "", errors)
    candidate = _mapping(profile.get("candidate"), "candidate", errors)
    resources = _mapping(profile.get("resources"), "resources", errors)
    goals = _mapping(profile.get("goals"), "goals", errors)
    permissions = _mapping(profile.get("permissions"), "permissions", errors)
    accounts = _mapping(profile.get("accounts", {}), "accounts", errors)

    _required(candidate, "candidate", ("full_name", "primary_email"), errors)
    _lists(resources, "resources", ("resumes",), errors)
    _lists(goals, "goals", ("functions", "target_roles"), errors)
    email = candidate.get("primary_email")
    if isinstance(email, str) and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        errors.append("candidate.primary_email must be a valid email address.")
    functions = goals.get("functions")
    if isinstance(functions, list):
        unsupported = [value for value in functions if value not in ALLOWED_FUNCTIONS]
        if unsupported:
            errors.append("goals.functions may contain only apply and recruiter-outreach.")

    resumes = resources.get("resumes", [])
    default_count = 0
    if isinstance(resumes, list):
        for index, resume in enumerate(resumes):
            item = _mapping(resume, f"resources.resumes[{index}]", errors)
            _required(item, f"resources.resumes[{index}]", ("id", "path"), errors)
            if item.get("default") is True:
                default_count += 1
            raw_path = item.get("path")
            if isinstance(raw_path, str) and raw_path and not _resolve(profile_path, raw_path).is_file():
                errors.append(f"Resume file does not exist: resources.resumes[{index}].path")
    if default_count != 1:
        errors.append("Exactly one resources.resumes entry must have default: true.")
    supporting = resources.get("supporting", [])
    if not isinstance(supporting, list):
        errors.append("resources.supporting must be a list.")
    else:
        for index, resource in enumerate(supporting):
            item = _mapping(resource, f"resources.supporting[{index}]", errors)
            if bool(item.get("path")) == bool(item.get("uri")):
                errors.append(f"resources.supporting[{index}] must contain exactly one of path or uri.")
            raw_path = item.get("path")
            if isinstance(raw_path, str) and raw_path and not _resolve(profile_path, raw_path).is_file():
                warnings.append(f"Supporting resource does not exist: resources.supporting[{index}].path")

    application_mode = permissions.get("application_submission")
    account_mode = permissions.get("account_creation")
    outreach_mode = permissions.get("recruiter_outreach")
    if application_mode not in ALLOWED_APPLICATION_MODES:
        errors.append("permissions.application_submission is invalid.")
    if account_mode not in ALLOWED_ACCOUNT_MODES:
        errors.append("permissions.account_creation is invalid.")
    if outreach_mode not in ALLOWED_OUTREACH_MODES:
        errors.append("permissions.recruiter_outreach is invalid.")
    approved_domains = permissions.get("approved_account_domains", [])
    if account_mode == "approved-domains" and (not isinstance(approved_domains, list) or not approved_domains):
        errors.append("permissions.approved_account_domains is required in approved-domains mode.")

    default_signup = accounts.get("default_signup")
    if default_signup is not None:
        signup = _mapping(default_signup, "accounts.default_signup", errors)
        _required(signup, "accounts.default_signup", ("email", "credential"), errors)
        if "credential" in signup:
            _validate_credential(signup["credential"], "accounts.default_signup.credential", errors)
    existing = accounts.get("existing", [])
    if not isinstance(existing, list):
        errors.append("accounts.existing must be a list.")
    else:
        for index, entry in enumerate(existing):
            account = _mapping(entry, f"accounts.existing[{index}]", errors)
            _required(account, f"accounts.existing[{index}]", ("platform", "domains", "login_email", "credential"), errors)
            if "credential" in account:
                _validate_credential(account["credential"], f"accounts.existing[{index}].credential", errors)
            if not isinstance(account.get("domains"), list) or not account.get("domains"):
                errors.append(f"accounts.existing[{index}].domains must be a non-empty list.")

    if mode == "apply":
        _required(candidate, "candidate", ("phone", "location"), errors)
        search = _mapping(profile.get("search"), "search", errors)
        eligibility = _mapping(profile.get("eligibility"), "eligibility", errors)
        _lists(search, "search", ("sources", "target_countries", "work_modes"), errors)
        _required(eligibility, "eligibility", ("work_authorization", "requires_sponsorship"), errors)
    elif mode == "outreach":
        outreach = _mapping(profile.get("outreach"), "outreach", errors)
        _required(outreach, "outreach", ("positioning", "daily_limit"), errors)
        daily_limit = outreach.get("daily_limit")
        if not isinstance(daily_limit, int) or not 1 <= daily_limit <= 25:
            errors.append("outreach.daily_limit must be an integer from 1 to 25.")

    if profile_path.suffix.lower() == ".json" and format_name == "yaml":
        warnings.append("The file contains YAML but uses a .json extension; rename it to .yaml.")
    if application_mode in ALLOWED_APPLICATION_MODES and application_mode != "prepare-only":
        warnings.append("Stored permission does not replace current-session approval for exact applications.")
    if outreach_mode in ALLOWED_OUTREACH_MODES and outreach_mode != "draft-only":
        warnings.append("Stored permission does not replace current-session approval for exact recipients and messages.")

    summary = {
        "valid": not errors,
        "format": format_name,
        "profile_file": profile_path.name,
        "candidate_configured": bool(candidate.get("full_name")),
        "functions": goals.get("functions"),
        "application_submission": application_mode,
        "recruiter_outreach": outreach_mode,
    }
    return errors, warnings, summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", type=Path)
    parser.add_argument("--mode", choices=("profile", "apply", "outreach"), default="profile")
    args = parser.parse_args()
    errors, warnings, summary = validate(args.profile.expanduser().resolve(), args.mode)
    print(json.dumps({"valid": not errors, "errors": errors, "warnings": warnings, "summary": summary}, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
