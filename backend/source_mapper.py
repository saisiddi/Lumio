import json
import os
import re
from pathlib import Path
from typing import Any


ALLOWED_EXTENSIONS = {".html", ".htm", ".js", ".jsx", ".ts", ".tsx", ".vue"}


def _safe_repo_path(repo_path: str | None) -> Path | None:
    if not repo_path:
      return None

    resolved = Path(repo_path).expanduser().resolve()
    if not resolved.exists() or not resolved.is_dir():
      return None
    return resolved


def detect_framework(repo_path: str | None) -> str:
    root = _safe_repo_path(repo_path)
    if root is None:
      return ""

    package_json = root / "package.json"
    if package_json.exists():
      try:
        data = json.loads(package_json.read_text(encoding="utf-8"))
      except (OSError, ValueError):
        data = {}
      deps = {
          **data.get("dependencies", {}),
          **data.get("devDependencies", {}),
      }
      if "next" in deps:
        return "Next.js"
      if "react" in deps:
        return "React"
      if "vue" in deps:
        return "Vue"

    if (root / "app").exists() or (root / "pages").exists():
      return "Next.js"
    if list(root.rglob("*.tsx")) or list(root.rglob("*.jsx")):
      return "React"
    if list(root.rglob("*.vue")):
      return "Vue"
    return "HTML"


def _extract_search_tokens(element_html: str, target: list[str]) -> list[str]:
    tokens: list[str] = []
    tokens.extend(target)

    id_matches = re.findall(r'id="([^"]+)"', element_html)
    tokens.extend(f'id="{value}"' for value in id_matches)

    class_matches = re.findall(r'class="([^"]+)"', element_html)
    for value in class_matches:
      for class_name in value.split():
        tokens.append(class_name)

    aria_matches = re.findall(r'(aria-[a-z-]+="[^"]+")', element_html)
    tokens.extend(aria_matches)

    text_content = re.sub(r"<[^>]+>", " ", element_html)
    text_content = re.sub(r"\s+", " ", text_content).strip()
    if text_content:
      tokens.append(text_content[:80])

    open_tag_match = re.search(r"<([a-zA-Z0-9-]+)", element_html)
    if open_tag_match:
      tokens.append(f"<{open_tag_match.group(1)}")

    unique_tokens: list[str] = []
    seen: set[str] = set()
    for token in tokens:
      cleaned = token.strip()
      if len(cleaned) < 3 or cleaned in seen:
        continue
      seen.add(cleaned)
      unique_tokens.append(cleaned)
    return unique_tokens[:12]


def _iter_candidate_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
      if not path.is_file():
        continue
      if path.suffix.lower() not in ALLOWED_EXTENSIONS:
        continue
      if any(part in {"node_modules", ".git", "dist", "build", ".next"} for part in path.parts):
        continue
      files.append(path)
    return files


def map_violation_to_source(
    violation: dict[str, Any],
    repo_path: str | None,
) -> dict[str, Any]:
    root = _safe_repo_path(repo_path)
    framework = detect_framework(repo_path)
    if root is None:
      return {
          "file_path": "",
          "line_number": None,
          "framework": framework,
          "snippet": "",
          "confidence": 0.0,
      }

    element_html = str(violation.get("element_html") or "")
    target = violation.get("target")
    target_list = [str(item) for item in target] if isinstance(target, list) else []
    tokens = _extract_search_tokens(element_html, target_list)
    if not tokens:
      return {
          "file_path": "",
          "line_number": None,
          "framework": framework,
          "snippet": "",
          "confidence": 0.0,
      }

    best_match: dict[str, Any] | None = None
    for path in _iter_candidate_files(root):
      try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
      except OSError:
        continue

      for index, line in enumerate(lines, start=1):
        score = 0
        for token in tokens:
          if token in line:
            score += 3 if token.startswith(("<", "id=", "aria-")) else 1
        if score == 0:
          continue

        snippet_start = max(0, index - 2)
        snippet_end = min(len(lines), index + 1)
        snippet = "\n".join(lines[snippet_start:snippet_end])
        candidate = {
            "file_path": str(path),
            "line_number": index,
            "framework": framework,
            "snippet": snippet,
            "confidence": min(1.0, score / 10),
            "score": score,
        }
        if best_match is None or candidate["score"] > best_match["score"]:
          best_match = candidate

    if best_match is None:
      return {
          "file_path": "",
          "line_number": None,
          "framework": framework,
          "snippet": "",
          "confidence": 0.0,
      }

    best_match.pop("score", None)
    return best_match


def build_developer_patch(
    *,
    violation_id: str,
    source: dict[str, Any],
    ai_fix: str,
) -> dict[str, str]:
    framework = str(source.get("framework") or "HTML")
    language = "html"
    code = ai_fix

    if framework in {"React", "Next.js"}:
      language = "jsx"
      code = (
          ai_fix
          .replace(" class=", " className=")
          .replace(" tabindex=", " tabIndex=")
          .replace(" for=", " htmlFor=")
      )
    elif framework == "Vue":
      language = "vue"

    line_number = source.get("line_number")
    file_path = source.get("file_path") or "the mapped source file"
    location = f"line {line_number}" if line_number else "the mapped location"
    title = f"Fix {violation_id} in {os.path.basename(file_path)}"
    commit_message = f"fix(a11y): resolve {violation_id} near {location}"
    pr_summary = (
        f"Update {file_path} at {location} to resolve the {violation_id} accessibility issue "
        f"with the suggested {framework or 'HTML'} patch."
    )

    return {
        "language": language,
        "title": title,
        "code": code,
        "commit_message": commit_message,
        "pr_summary": pr_summary,
    }
