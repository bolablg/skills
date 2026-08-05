#!/usr/bin/env python3
"""Read Job Hunter JSON or a deliberately small, portable YAML subset."""

from __future__ import annotations

import ast
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class ProfileParseError(ValueError):
    pass


@dataclass(frozen=True)
class Line:
    number: int
    indent: int
    text: str


def _strip_comment(value: str) -> str:
    quote: str | None = None
    escaped = False
    for index, character in enumerate(value):
        if escaped:
            escaped = False
            continue
        if character == "\\" and quote:
            escaped = True
            continue
        if character in "'\"":
            quote = None if quote == character else character if quote is None else quote
            continue
        if character == "#" and quote is None and (index == 0 or value[index - 1].isspace()):
            return value[:index].rstrip()
    return value.rstrip()


def _split_mapping(value: str, number: int) -> tuple[str, str]:
    quote: str | None = None
    escaped = False
    for index, character in enumerate(value):
        if escaped:
            escaped = False
            continue
        if character == "\\" and quote:
            escaped = True
            continue
        if character in "'\"":
            quote = None if quote == character else character if quote is None else quote
            continue
        if character == ":" and quote is None:
            key = value[:index].strip()
            if not key:
                break
            return key, value[index + 1 :].strip()
    raise ProfileParseError(f"Line {number}: expected a YAML mapping entry.")


def _scalar(value: str, number: int) -> Any:
    if value in {"null", "Null", "NULL", "~"}:
        return None
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.startswith(("[", "{")):
        try:
            return json.loads(value)
        except json.JSONDecodeError as error:
            raise ProfileParseError(f"Line {number}: inline collections must use JSON syntax.") from error
    if value.startswith(("'", '"')):
        try:
            parsed = ast.literal_eval(value)
        except (SyntaxError, ValueError) as error:
            raise ProfileParseError(f"Line {number}: invalid quoted value.") from error
        if not isinstance(parsed, str):
            raise ProfileParseError(f"Line {number}: quoted YAML values must be strings.")
        return parsed
    if re.fullmatch(r"[-+]?\d+", value):
        return int(value)
    if re.fullmatch(r"[-+]?(?:\d+\.\d*|\d*\.\d+)", value):
        return float(value)
    if value in {"|", ">"}:
        raise ProfileParseError(f"Line {number}: block scalars are not supported; use a quoted string.")
    return value


def _tokenize(text: str) -> list[Line]:
    lines: list[Line] = []
    for number, raw in enumerate(text.splitlines(), start=1):
        if "\t" in raw[: len(raw) - len(raw.lstrip())]:
            raise ProfileParseError(f"Line {number}: use spaces, not tabs, for indentation.")
        cleaned = _strip_comment(raw)
        if not cleaned.strip():
            continue
        indent = len(cleaned) - len(cleaned.lstrip(" "))
        if indent % 2:
            raise ProfileParseError(f"Line {number}: indentation must use multiples of two spaces.")
        lines.append(Line(number, indent, cleaned.strip()))
    return lines


def _parse_mapping(
    lines: list[Line], index: int, indent: int, initial: dict[str, Any] | None = None
) -> tuple[dict[str, Any], int]:
    result = initial or {}
    while index < len(lines):
        line = lines[index]
        if line.indent < indent:
            break
        if line.indent > indent:
            raise ProfileParseError(f"Line {line.number}: unexpected indentation.")
        if line.text.startswith("-"):
            break
        key, remainder = _split_mapping(line.text, line.number)
        if key in result:
            raise ProfileParseError(f"Line {line.number}: duplicate key {key!r}.")
        index += 1
        if remainder:
            result[key] = _scalar(remainder, line.number)
        elif index < len(lines) and lines[index].indent > indent:
            result[key], index = _parse_block(lines, index, lines[index].indent)
        else:
            result[key] = None
    return result, index


def _parse_sequence(lines: list[Line], index: int, indent: int) -> tuple[list[Any], int]:
    result: list[Any] = []
    while index < len(lines):
        line = lines[index]
        if line.indent < indent:
            break
        if line.indent != indent or not line.text.startswith("-"):
            raise ProfileParseError(f"Line {line.number}: invalid sequence indentation.")
        remainder = line.text[1:].strip()
        index += 1
        if not remainder:
            if index >= len(lines) or lines[index].indent <= indent:
                result.append(None)
            else:
                value, index = _parse_block(lines, index, lines[index].indent)
                result.append(value)
            continue
        if ":" in remainder:
            key, value_text = _split_mapping(remainder, line.number)
            item: dict[str, Any] = {}
            if value_text:
                item[key] = _scalar(value_text, line.number)
            elif index < len(lines) and lines[index].indent > indent:
                item[key], index = _parse_block(lines, index, lines[index].indent)
            else:
                item[key] = None
            if index < len(lines) and lines[index].indent == indent + 2 and not lines[index].text.startswith("-"):
                item, index = _parse_mapping(lines, index, indent + 2, item)
            result.append(item)
        else:
            result.append(_scalar(remainder, line.number))
    return result, index


def _parse_block(lines: list[Line], index: int, indent: int) -> tuple[Any, int]:
    if lines[index].text.startswith("-"):
        return _parse_sequence(lines, index, indent)
    return _parse_mapping(lines, index, indent)


def parse_yaml_subset(text: str) -> dict[str, Any]:
    lines = _tokenize(text)
    if not lines:
        raise ProfileParseError("Profile is empty.")
    if lines[0].indent != 0:
        raise ProfileParseError(f"Line {lines[0].number}: root content must not be indented.")
    value, index = _parse_block(lines, 0, 0)
    if index != len(lines) or not isinstance(value, dict):
        raise ProfileParseError("Profile root must be a mapping/object.")
    return value


def load_profile(path: Path) -> tuple[dict[str, Any], str]:
    text = path.read_text(encoding="utf-8")
    stripped = text.lstrip()
    if stripped.startswith("{"):
        try:
            value = json.loads(text)
        except json.JSONDecodeError as error:
            raise ProfileParseError(f"Invalid JSON: {error}") from error
        format_name = "json"
    else:
        value = parse_yaml_subset(text)
        format_name = "yaml"
    if not isinstance(value, dict):
        raise ProfileParseError("Profile root must be a mapping/object.")
    return value, format_name
