#!/usr/bin/env python3
"""Validate a Job Hunter YAML or JSON profile without exposing private values."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from profile_io import ProfileParseError, load_profile


ALLOWED_SECRET_SOURCES = {"prompt", "env", "macos-keychain", "secret-manager", "browser-session"}
ALLOWED_APPLICATION_MODES = {"prepare-only", "review-each", "approved-batch"}
ALLOWED_ACCOUNT_MODES = {"disabled", "ask-each", "approved-domains"}
ALLOWED_OUTREACH_MODES = {"draft-only", "review-each", "approved-batch"}
ALLOWED_FUNCTIONS = {"apply", "recruiter-outreach"}
ALLOWED_WORK_MODES = {"remote", "hybrid", "onsite"}
ALLOWED_RELOCATION = {"yes", "no", "case-by-case"}
ALLOWED_AUTHORIZATION = {"authorized", "not-authorized", "unknown"}
ALLOWED_ACCESS_MODES = {"public", "user-provided", "browser-session", "manual-handoff"}
ALLOWED_RESOURCE_USES = {
    "candidate-evidence",
    "application-tailoring",
    "profile-link",
    "technical-evaluation",
    "recruiter-outreach",
}
SENSITIVE_KEY = re.compile(r"(?:password|passwd|secret|token|api[_-]?key|private[_-]?key)", re.I)
COUNTRY_CODE = re.compile(r"[A-Z]{2}")
ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


def _mapping(value: Any, path: str, errors: list[str]) -> dict[str, Any]:
    if not isinstance(value, dict):
        errors.append(f"{path} must be an object/mapping.")
        return {}
    return value


def _required(mapping: dict[str, Any], path: str, fields: tuple[str, ...], errors: list[str]) -> None:
    for field in fields:
        if field not in mapping or mapping[field] in (None, "", []):
            errors.append(f"Missing required field: {path}.{field}")


def _nonempty_list(mapping: dict[str, Any], path: str, field: str, errors: list[str]) -> list[Any]:
    value = mapping.get(field)
    if not isinstance(value, list) or not value:
        errors.append(f"{path}.{field} must be a non-empty list.")
        return []
    return value


def _list(mapping: dict[str, Any], path: str, field: str, errors: list[str]) -> list[Any]:
    value = mapping.get(field, [])
    if not isinstance(value, list):
        errors.append(f"{path}.{field} must be a list.")
        return []
    return value


def _country_codes(values: Any, path: str, errors: list[str], *, required: bool = False) -> list[str]:
    if not isinstance(values, list) or (required and not values):
        errors.append(f"{path} must be {'a non-empty list' if required else 'a list'} of uppercase ISO country codes.")
        return []
    valid: list[str] = []
    for index, value in enumerate(values):
        if not isinstance(value, str) or not COUNTRY_CODE.fullmatch(value):
            errors.append(f"{path}[{index}] must be an uppercase ISO 3166-1 alpha-2 code.")
        else:
            valid.append(value)
    if len(valid) != len(set(valid)):
        errors.append(f"{path} must not contain duplicate countries.")
    return valid


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


def _resource_uses(item: dict[str, Any], path: str, errors: list[str]) -> None:
    uses = _nonempty_list(item, path, "use_for", errors)
    unsupported = [value for value in uses if value not in ALLOWED_RESOURCE_USES]
    if unsupported:
        errors.append(f"{path}.use_for contains unsupported values.")
    if not isinstance(item.get("share_with_employers"), bool):
        errors.append(f"{path}.share_with_employers must be true or false.")


def _validate_resources(
    resources: dict[str, Any], profile_path: Path, errors: list[str], warnings: list[str]
) -> None:
    seen_ids: set[str] = set()
    resumes = _nonempty_list(resources, "resources", "resumes", errors)
    default_count = 0
    for index, value in enumerate(resumes):
        path = f"resources.resumes[{index}]"
        item = _mapping(value, path, errors)
        _required(item, path, ("id", "path", "share_with_employers"), errors)
        resource_id = item.get("id")
        if isinstance(resource_id, str):
            if resource_id in seen_ids:
                errors.append(f"Duplicate resource id: {resource_id}")
            seen_ids.add(resource_id)
        if item.get("default") is True:
            default_count += 1
        if not isinstance(item.get("share_with_employers"), bool):
            errors.append(f"{path}.share_with_employers must be true or false.")
        if not isinstance(item.get("target_roles", []), list):
            errors.append(f"{path}.target_roles must be a list.")
        raw_path = item.get("path")
        if isinstance(raw_path, str) and raw_path and not _resolve(profile_path, raw_path).is_file():
            errors.append(f"Resume file does not exist: {path}.path")
    if default_count != 1:
        errors.append("Exactly one resources.resumes entry must have default: true.")

    local_resources = _list(resources, "resources", "local", errors)
    for index, value in enumerate(local_resources):
        path = f"resources.local[{index}]"
        item = _mapping(value, path, errors)
        _required(item, path, ("id", "type", "path", "use_for", "share_with_employers"), errors)
        resource_id = item.get("id")
        if isinstance(resource_id, str):
            if resource_id in seen_ids:
                errors.append(f"Duplicate resource id: {resource_id}")
            seen_ids.add(resource_id)
        _resource_uses(item, path, errors)
        if "uri" in item:
            errors.append(f"{path} must use path, not uri.")
        raw_path = item.get("path")
        if isinstance(raw_path, str) and raw_path and not _resolve(profile_path, raw_path).is_file():
            warnings.append(f"Local resource does not exist: {path}.path")

    online_resources = _list(resources, "resources", "online", errors)
    for index, value in enumerate(online_resources):
        path = f"resources.online[{index}]"
        item = _mapping(value, path, errors)
        _required(item, path, ("id", "type", "uri", "access_mode", "use_for", "share_with_employers"), errors)
        resource_id = item.get("id")
        if isinstance(resource_id, str):
            if resource_id in seen_ids:
                errors.append(f"Duplicate resource id: {resource_id}")
            seen_ids.add(resource_id)
        _resource_uses(item, path, errors)
        uri = item.get("uri")
        parsed = urlparse(uri) if isinstance(uri, str) else None
        if not parsed or parsed.scheme != "https" or not parsed.netloc:
            errors.append(f"{path}.uri must be an absolute HTTPS URL.")
        access_mode = item.get("access_mode")
        if access_mode not in ALLOWED_ACCESS_MODES:
            errors.append(f"{path}.access_mode is invalid.")
        if str(item.get("type", "")).lower() == "linkedin" and access_mode == "public":
            errors.append(f"{path}: LinkedIn cannot use autonomous public access; use user-provided, browser-session, or manual-handoff.")


def _validate_markets(
    preferences: dict[str, Any], candidate: dict[str, Any], errors: list[str]
) -> set[str]:
    markets = _nonempty_list(preferences, "career_preferences", "target_markets", errors)
    market_ids: set[str] = set()
    priorities: set[int] = set()
    target_countries: set[str] = set()
    current_location = _mapping(candidate.get("current_location"), "candidate.current_location", errors)
    current_country = current_location.get("country")
    for index, value in enumerate(markets):
        path = f"career_preferences.target_markets[{index}]"
        market = _mapping(value, path, errors)
        _required(market, path, ("id", "priority", "geography", "work_modes", "relocation"), errors)
        market_id = market.get("id")
        if isinstance(market_id, str):
            if market_id in market_ids:
                errors.append(f"Duplicate market id: {market_id}")
            market_ids.add(market_id)
        priority = market.get("priority")
        if not isinstance(priority, int) or isinstance(priority, bool) or priority < 1:
            errors.append(f"{path}.priority must be a positive integer.")
        elif priority in priorities:
            errors.append(f"{path}.priority must be unique.")
        else:
            priorities.add(priority)
        geography = _mapping(market.get("geography"), f"{path}.geography", errors)
        countries = _country_codes(geography.get("countries"), f"{path}.geography.countries", errors, required=True)
        target_countries.update(countries)
        for field in ("regions", "cities"):
            _list(geography, f"{path}.geography", field, errors)
        modes = _nonempty_list(market, path, "work_modes", errors)
        if any(mode not in ALLOWED_WORK_MODES for mode in modes):
            errors.append(f"{path}.work_modes may contain only remote, hybrid, and onsite.")
        if len(modes) != len(set(modes)):
            errors.append(f"{path}.work_modes must not contain duplicates.")
        if "remote" in modes:
            remote = _mapping(market.get("remote_arrangement"), f"{path}.remote_arrangement", errors)
            if not isinstance(remote.get("may_work_from_current_country"), bool):
                errors.append(f"{path}.remote_arrangement.may_work_from_current_country must be true or false.")
            residences = _country_codes(
                remote.get("candidate_residence_countries"),
                f"{path}.remote_arrangement.candidate_residence_countries",
                errors,
                required=True,
            )
            if remote.get("may_work_from_current_country") is True and isinstance(current_country, str) and current_country not in residences:
                errors.append(f"{path}.remote_arrangement must include the candidate's current country.")
            offset = remote.get("maximum_timezone_difference_hours")
            if offset is not None and (not isinstance(offset, int) or isinstance(offset, bool) or not 0 <= offset <= 24):
                errors.append(f"{path}.remote_arrangement.maximum_timezone_difference_hours must be 0 through 24 or null.")
        relocation = _mapping(market.get("relocation"), f"{path}.relocation", errors)
        willingness = relocation.get("willingness")
        if willingness not in ALLOWED_RELOCATION:
            errors.append(f"{path}.relocation.willingness must be yes, no, or case-by-case.")
        support = relocation.get("employer_support_required")
        if willingness in {"yes", "case-by-case"} and not isinstance(support, bool):
            errors.append(f"{path}.relocation.employer_support_required must be true or false.")
    return target_countries


def _validate_eligibility(
    profile: dict[str, Any], target_countries: set[str], apply_mode: bool, errors: list[str], warnings: list[str]
) -> None:
    entries = profile.get("work_eligibility")
    if not isinstance(entries, list):
        errors.append("work_eligibility must be a list.")
        return
    by_country: dict[str, dict[str, Any]] = {}
    for index, value in enumerate(entries):
        path = f"work_eligibility[{index}]"
        item = _mapping(value, path, errors)
        _required(item, path, ("country", "authorization_status", "sponsorship_required", "candidate_confirmed"), errors)
        country = item.get("country")
        if not isinstance(country, str) or not COUNTRY_CODE.fullmatch(country):
            errors.append(f"{path}.country must be an uppercase ISO country code.")
            continue
        if country in by_country:
            errors.append(f"Duplicate work eligibility country: {country}")
        by_country[country] = item
        status = item.get("authorization_status")
        if status not in ALLOWED_AUTHORIZATION:
            errors.append(f"{path}.authorization_status is invalid.")
        sponsorship = item.get("sponsorship_required")
        if sponsorship not in {True, False, "unknown"}:
            errors.append(f"{path}.sponsorship_required must be true, false, or unknown.")
        if status == "authorized" and sponsorship is not False:
            errors.append(f"{path}: authorized candidates must set sponsorship_required to false.")
        confirmed = item.get("candidate_confirmed")
        if not isinstance(confirmed, bool):
            errors.append(f"{path}.candidate_confirmed must be true or false.")
        confirmed_at = item.get("last_confirmed")
        if confirmed is True and (not isinstance(confirmed_at, str) or not ISO_DATE.fullmatch(confirmed_at)):
            errors.append(f"{path}.last_confirmed must be an ISO date when candidate_confirmed is true.")
        if apply_mode and (status == "unknown" or sponsorship == "unknown" or confirmed is not True):
            errors.append(f"{path}: eligibility must be candidate-confirmed before applying.")
    missing = sorted(target_countries - set(by_country))
    if missing:
        errors.append("Missing work_eligibility entries for target countries: " + ", ".join(missing))
    extra = sorted(set(by_country) - target_countries)
    if extra:
        warnings.append("Work eligibility is configured outside current target markets: " + ", ".join(extra))


def _validate_search_constraints(
    constraints: dict[str, Any], eligibility: Any, apply_mode: bool, errors: list[str]
) -> None:
    _nonempty_list(constraints, "search_constraints", "sources", errors)
    for field in (
        "include_jobs_requiring_sponsorship",
        "include_jobs_with_unknown_sponsorship",
        "include_worldwide_remote_jobs",
        "verify_remote_accepts_residence_country",
    ):
        if not isinstance(constraints.get(field), bool):
            errors.append(f"search_constraints.{field} must be true or false.")
    score = constraints.get("minimum_match_score")
    if not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= 100:
        errors.append("search_constraints.minimum_match_score must be an integer from 0 through 100.")
    days = constraints.get("posted_within_days")
    if days is not None and (not isinstance(days, int) or isinstance(days, bool) or days < 1):
        errors.append("search_constraints.posted_within_days must be a positive integer or null.")
    travel = constraints.get("maximum_travel_percent")
    if travel is not None and (not isinstance(travel, int) or isinstance(travel, bool) or not 0 <= travel <= 100):
        errors.append("search_constraints.maximum_travel_percent must be 0 through 100 or null.")
    compensation = _mapping(constraints.get("compensation"), "search_constraints.compensation", errors)
    minimum = compensation.get("minimum")
    if minimum is not None and (not isinstance(minimum, (int, float)) or isinstance(minimum, bool) or minimum < 0):
        errors.append("search_constraints.compensation.minimum must be a non-negative number or null.")
    if minimum is not None and not compensation.get("currency"):
        errors.append("search_constraints.compensation.currency is required when minimum is set.")
    _list(constraints, "search_constraints", "languages", errors)
    _list(constraints, "search_constraints", "excluded_companies", errors)
    _list(constraints, "search_constraints", "excluded_role_terms", errors)
    if apply_mode and isinstance(eligibility, list):
        needs_sponsorship = any(item.get("sponsorship_required") is True for item in eligibility if isinstance(item, dict))
        if needs_sponsorship and constraints.get("include_jobs_requiring_sponsorship") is not True:
            errors.append("At least one target market requires sponsorship, but sponsored jobs are excluded.")


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
        errors.append("Legacy default credential arrays are unsafe. Run migrate_legacy.py, rotate the password, and use a credential reference.")
    if isinstance(profile.get("search"), dict) and "target_countries" in profile["search"]:
        errors.append("Legacy flat search fields are unsupported; complete career_preferences.target_markets and work_eligibility.")

    _scan_plaintext_secrets(profile, "", errors)
    candidate = _mapping(profile.get("candidate"), "candidate", errors)
    resources = _mapping(profile.get("resources"), "resources", errors)
    goals = _mapping(profile.get("goals"), "goals", errors)
    preferences = _mapping(profile.get("career_preferences"), "career_preferences", errors)
    constraints = _mapping(profile.get("search_constraints"), "search_constraints", errors)
    permissions = _mapping(profile.get("permissions"), "permissions", errors)
    accounts = _mapping(profile.get("accounts", {}), "accounts", errors)

    _required(candidate, "candidate", ("full_name", "primary_email"), errors)
    email = candidate.get("primary_email")
    if isinstance(email, str) and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        errors.append("candidate.primary_email must be a valid email address.")
    current_location = _mapping(candidate.get("current_location"), "candidate.current_location", errors)
    country = current_location.get("country")
    if country is not None and (not isinstance(country, str) or not COUNTRY_CODE.fullmatch(country)):
        errors.append("candidate.current_location.country must be an uppercase ISO country code.")

    _validate_resources(resources, profile_path, errors, warnings)
    functions = _nonempty_list(goals, "goals", "functions", errors)
    if any(value not in ALLOWED_FUNCTIONS for value in functions):
        errors.append("goals.functions may contain only apply and recruiter-outreach.")
    _nonempty_list(preferences, "career_preferences", "target_roles", errors)
    for field in ("target_seniority", "target_industries", "employment_types"):
        _list(preferences, "career_preferences", field, errors)

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
        for index, value in enumerate(existing):
            path = f"accounts.existing[{index}]"
            account = _mapping(value, path, errors)
            _required(account, path, ("platform", "domains", "login_email", "credential"), errors)
            if "credential" in account:
                _validate_credential(account["credential"], f"{path}.credential", errors)
            if not isinstance(account.get("domains"), list) or not account.get("domains"):
                errors.append(f"{path}.domains must be a non-empty list.")

    target_countries: set[str] = set()
    if mode == "apply":
        _required(candidate, "candidate", ("phone", "current_location"), errors)
        _required(current_location, "candidate.current_location", ("country", "timezone"), errors)
        target_countries = _validate_markets(preferences, candidate, errors)
        _validate_eligibility(profile, target_countries, True, errors, warnings)
        _validate_search_constraints(constraints, profile.get("work_eligibility"), True, errors)
    else:
        markets = preferences.get("target_markets")
        if isinstance(markets, list) and markets:
            target_countries = _validate_markets(preferences, candidate, errors)
            _validate_eligibility(profile, target_countries, False, errors, warnings)
        _validate_search_constraints(constraints, profile.get("work_eligibility"), False, errors)

    if mode == "outreach":
        outreach = _mapping(profile.get("outreach"), "outreach", errors)
        _required(outreach, "outreach", ("positioning", "daily_limit"), errors)
        daily_limit = outreach.get("daily_limit")
        if not isinstance(daily_limit, int) or isinstance(daily_limit, bool) or not 1 <= daily_limit <= 25:
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
        "functions": functions,
        "target_market_count": len(preferences.get("target_markets", [])) if isinstance(preferences.get("target_markets"), list) else 0,
        "resume_count": len(resources.get("resumes", [])) if isinstance(resources.get("resumes"), list) else 0,
        "optional_resource_count": sum(
            len(resources.get(field, [])) if isinstance(resources.get(field), list) else 0 for field in ("local", "online")
        ),
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
