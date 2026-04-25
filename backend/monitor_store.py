import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


STORE_PATH = Path(__file__).resolve().parent / "scan_history.json"


def _load_store() -> dict[str, list[dict[str, Any]]]:
    if not STORE_PATH.exists():
      return {}
    try:
      return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError):
      return {}


def _save_store(data: dict[str, list[dict[str, Any]]]) -> None:
    STORE_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def build_issue_signatures(violations: list[dict[str, Any]]) -> set[str]:
    signatures: set[str] = set()
    for violation in violations:
      target = "|".join(violation.get("target") or [])
      page_url = violation.get("page_url") or ""
      signatures.add(f"{page_url}::{violation.get('id')}::{target}")
    return signatures


def record_scan(url: str, total_violations: int, signatures: set[str]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    store = _load_store()
    entries = store.get(url, [])
    previous_entry = entries[-1] if entries else None

    previous_signatures = set(previous_entry.get("signatures", [])) if previous_entry else set()
    new_issues = len(signatures - previous_signatures)
    resolved_issues = len(previous_signatures - signatures)
    unchanged_issues = len(signatures & previous_signatures)

    scan_time = datetime.now(timezone.utc).isoformat()
    entries.append(
        {
            "scan_time": scan_time,
            "total_violations": total_violations,
            "signatures": sorted(signatures),
            "new_issues": new_issues,
            "resolved_issues": resolved_issues,
        }
    )
    store[url] = entries[-10:]
    _save_store(store)

    regression_summary = {
        "new_issues": new_issues,
        "resolved_issues": resolved_issues,
        "unchanged_issues": unchanged_issues,
        "previous_scan_time": previous_entry.get("scan_time", "") if previous_entry else "",
    }
    changelog = [
        {
            "scan_time": entry.get("scan_time", ""),
            "total_violations": int(entry.get("total_violations", 0)),
            "new_issues": int(entry.get("new_issues", 0)),
            "resolved_issues": int(entry.get("resolved_issues", 0)),
        }
        for entry in reversed(store[url])
    ]
    return regression_summary, changelog
