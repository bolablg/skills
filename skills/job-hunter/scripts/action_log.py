#!/usr/bin/env python3
"""Check and append private Job Hunter actions without duplicating guarded attempts."""

from __future__ import annotations

import argparse
import csv
import os
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator


FIELDS = (
    "timestamp_utc",
    "event_id",
    "workflow",
    "action",
    "target_key",
    "status",
    "batch_id",
    "destination",
    "details",
)
GUARDED_ACTIONS = {
    "account-create-attempt",
    "application-submit-attempt",
    "recruiter-contact-attempt",
    "recruiter-follow-up-attempt",
}
WORKFLOWS = {"research", "apply", "recruiter-outreach", "account", "system"}


def normalize(value: str, field: str) -> str:
    cleaned = " ".join(value.strip().split())
    if not cleaned:
        raise ValueError(f"{field} must not be empty.")
    if cleaned[0] in "=+-@":
        raise ValueError(f"{field} starts with a spreadsheet-formula character.")
    return cleaned


def read_rows(log_path: Path) -> list[dict[str, str]]:
    if not log_path.exists():
        raise FileNotFoundError("Action log does not exist; initialize the Job Hunter project first.")
    with log_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if tuple(reader.fieldnames or ()) != FIELDS:
            raise ValueError("Action log header is invalid.")
        return list(reader)


def duplicates(rows: list[dict[str, str]], action: str, target_key: str) -> list[dict[str, str]]:
    return [row for row in rows if row.get("action") == action and row.get("target_key") == target_key]


@contextmanager
def exclusive_lock(log_path: Path) -> Iterator[None]:
    lock_path = log_path.with_name(f"{log_path.name}.lock")
    descriptor: int | None = None
    for _ in range(100):
        try:
            descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            os.write(descriptor, str(os.getpid()).encode("ascii"))
            break
        except FileExistsError:
            time.sleep(0.05)
    if descriptor is None:
        raise TimeoutError("Action log is busy; retry after the other Job Hunter action finishes.")
    try:
        yield
    finally:
        os.close(descriptor)
        lock_path.unlink(missing_ok=True)


def check(log_path: Path, action: str, target_key: str) -> list[dict[str, str]]:
    return duplicates(read_rows(log_path), normalize(action, "action"), normalize(target_key, "target_key"))


def record(
    log_path: Path,
    workflow: str,
    action: str,
    target_key: str,
    status: str,
    batch_id: str,
    destination: str,
    details: str,
    approved_retry: bool,
) -> dict[str, str]:
    workflow = normalize(workflow, "workflow")
    action = normalize(action, "action")
    target_key = normalize(target_key, "target_key")
    status = normalize(status, "status")
    if workflow not in WORKFLOWS:
        raise ValueError(f"workflow must be one of: {', '.join(sorted(WORKFLOWS))}.")
    with exclusive_lock(log_path):
        rows = read_rows(log_path)
        prior = duplicates(rows, action, target_key)
        if action in GUARDED_ACTIONS and prior and not approved_retry:
            raise ValueError(
                f"Duplicate guarded action refused; prior event {prior[-1]['event_id']} has status {prior[-1]['status']}. "
                "Review the existing event and obtain explicit retry approval."
            )
        row = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "event_id": str(uuid.uuid4()),
            "workflow": workflow,
            "action": action,
            "target_key": target_key,
            "status": status,
            "batch_id": " ".join(batch_id.strip().split()),
            "destination": " ".join(destination.strip().split()),
            "details": " ".join(details.strip().split()),
        }
        with log_path.open("a", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writerow(row)
        return row


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    check_parser = subparsers.add_parser("check", help="Check whether an action/target pair already exists")
    check_parser.add_argument("log", type=Path)
    check_parser.add_argument("--action", required=True)
    check_parser.add_argument("--target-key", required=True)
    record_parser = subparsers.add_parser("record", help="Append one meaningful action")
    record_parser.add_argument("log", type=Path)
    record_parser.add_argument("--workflow", required=True)
    record_parser.add_argument("--action", required=True)
    record_parser.add_argument("--target-key", required=True)
    record_parser.add_argument("--status", required=True)
    record_parser.add_argument("--batch-id", default="")
    record_parser.add_argument("--destination", default="")
    record_parser.add_argument("--details", default="")
    record_parser.add_argument("--approved-retry", action="store_true")
    args = parser.parse_args()
    try:
        log_path = args.log.expanduser().resolve()
        if args.command == "check":
            prior = check(log_path, args.action, args.target_key)
            if prior:
                latest = prior[-1]
                print(f"FOUND event_id={latest['event_id']} status={latest['status']}")
                return 2
            print("CLEAR")
            return 0
        row = record(
            log_path,
            args.workflow,
            args.action,
            args.target_key,
            args.status,
            args.batch_id,
            args.destination,
            args.details,
            args.approved_retry,
        )
    except (OSError, TimeoutError, ValueError) as error:
        print(str(error))
        return 1
    print(f"RECORDED event_id={row['event_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
