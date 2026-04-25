import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, TypeVar

from dotenv import load_dotenv

T = TypeVar("T")
R = TypeVar("R")


load_dotenv()


def get_env(name: str, default: str | None = None) -> str | None:
    """Read an environment variable with optional default."""
    return os.getenv(name, default)


def safe_json_loads(text: str) -> dict[str, Any] | None:
    """Parse text as JSON and return a dict, or None if parsing fails."""
    try:
        parsed = json.loads(text)
    except (TypeError, ValueError):
        return None

    if isinstance(parsed, dict):
        return parsed
    return None


def run_parallel(
    function: Callable[[T], R],
    items: list[T],
    max_workers: int = 5,
) -> list[R]:
    """Run a function in parallel over items and return results in input order."""
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        return list(executor.map(function, items))


def limit_violations(violations: list[Any], limit: int = 10) -> list[Any]:
    """Return only the first N violations for faster demo responses."""
    return violations[:limit]
