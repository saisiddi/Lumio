import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_explainer import FALLBACK_RESULT, get_ai_fix, get_rule_based_fallback
from models import ExplainRequest, ExplainResponse, ScanRequest, ScanResponse
from monitor_store import build_issue_signatures, record_scan
from prompt_builder import build_explainer_prompt, build_prompt
from scanner import scan_website
from source_mapper import build_developer_patch, map_violation_to_source
from utils import run_parallel


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("lumio-backend")


PRIORITY_BY_IMPACT = {
    "critical": (100, "P0"),
    "serious": (80, "P1"),
    "moderate": (55, "P2"),
    "minor": (30, "P3"),
}

USERS_BY_RULE = {
    "html-has-lang": ["Screen reader users", "Blind users", "Multilingual users"],
    "landmark-one-main": ["Screen reader users", "Keyboard users"],
    "page-has-heading-one": ["Screen reader users", "Users with cognitive disabilities"],
    "region": ["Screen reader users", "Keyboard users"],
    "button-name": ["Screen reader users", "Voice control users", "Keyboard users"],
    "link-name": ["Screen reader users", "Voice control users"],
    "image-alt": ["Screen reader users", "Blind users"],
}


app = FastAPI(title="lumio-backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Application startup complete")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/")
def home() -> dict[str, str]:
    return {
        "service": "lumio-backend",
        "status": "running",
        "health": "/health",
        "scan_endpoint": "/scan",
        "features": "multi-page scan, WCAG grouping, source mapping, changelog",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _is_valid_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _extract_node_details(violation: dict[str, object]) -> tuple[str, list[str], str]:
    node_html = ""
    target: list[str] = []
    failure_summary = ""
    nodes = violation.get("nodes")
    if isinstance(nodes, list) and nodes and isinstance(nodes[0], dict):
        first_node = nodes[0]
        node_html = str(first_node.get("html") or "")

        raw_target = first_node.get("target")
        if isinstance(raw_target, list):
            target = [str(item) for item in raw_target if item is not None]

        failure_summary = str(first_node.get("failureSummary") or "")
    return node_html, target, failure_summary


def _wcag_tags(tags: object) -> list[str]:
    if not isinstance(tags, list):
        return []
    wcag = [str(tag) for tag in tags if isinstance(tag, str) and tag.startswith("wcag")]
    return wcag[:4]


def _priority_fields(impact: str | None) -> tuple[int, str]:
    if impact is None:
        return 20, "P3"
    return PRIORITY_BY_IMPACT.get(impact, (20, "P3"))


def _process_violation(payload: tuple[dict[str, object], str | None]) -> dict[str, object]:
    violation, repo_path = payload
    prompt = build_prompt(violation)
    ai_fix = get_ai_fix(prompt)
    violation_id = str(violation.get("id") or "unknown")

    if ai_fix == FALLBACK_RESULT:
        ai_fix = get_rule_based_fallback(violation_id)

    node_html, target, failure_summary = _extract_node_details(violation)
    impact = str(violation.get("impact")) if violation.get("impact") is not None else None
    priority_score, business_priority = _priority_fields(impact)

    enriched = {
        "id": violation_id,
        "impact": impact,
        "description": str(violation.get("description") or "No description provided"),
        "element_html": node_html,
        "target": target,
        "failure_summary": failure_summary,
        "help_url": str(violation.get("helpUrl") or ""),
        "page_url": str(violation.get("page_url") or ""),
        "page_title": str(violation.get("page_title") or ""),
        "wcag_tags": _wcag_tags(violation.get("tags")),
        "affected_users": USERS_BY_RULE.get(
            violation_id,
            ["Screen reader users", "Keyboard users"],
        ),
        "business_priority": business_priority,
        "priority_score": priority_score,
        "duplicate_occurrences": 1,
        "ai_explanation": ai_fix.get("explanation", "Could not generate explanation."),
        "ai_impact": ai_fix.get("impact", "Unknown impact."),
        "ai_fix": ai_fix.get("fixed_html", ""),
    }

    source = map_violation_to_source(enriched, repo_path)
    patch = build_developer_patch(
        violation_id=violation_id,
        source=source,
        ai_fix=enriched["ai_fix"],
    )

    enriched["source"] = source
    enriched["patch"] = patch
    return enriched


def _group_issues(violations: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, dict[str, object]] = {}
    pages_by_group: dict[str, set[str]] = defaultdict(set)

    for violation in violations:
        group_key = f"{violation['id']}::{violation['description']}"
        pages_by_group[group_key].add(str(violation.get("page_url") or ""))

        existing = grouped.get(group_key)
        if existing is None:
            grouped[group_key] = {
                "key": group_key,
                "id": violation["id"],
                "description": violation["description"],
                "impact": violation.get("impact"),
                "business_priority": violation.get("business_priority", ""),
                "affected_users": violation.get("affected_users", []),
                "wcag_tags": violation.get("wcag_tags", []),
                "total_occurrences": 1,
                "pages": [],
                "recommended_fix": violation.get("ai_fix", ""),
            }
        else:
            existing["total_occurrences"] = int(existing["total_occurrences"]) + 1

    for group_key, item in grouped.items():
        item["pages"] = sorted(page for page in pages_by_group[group_key] if page)

    return sorted(
        grouped.values(),
        key=lambda item: (
            PRIORITY_BY_IMPACT.get(item.get("impact"), (0, ""))[0],
            item["total_occurrences"],
        ),
        reverse=True,
    )


@app.post("/scan", response_model=ScanResponse)
def scan(request: ScanRequest) -> ScanResponse:
    request_started_at = time.perf_counter()
    logger.info("scan_start url=%s max_pages=%d", request.url, request.max_pages)
    try:
        if not _is_valid_url(request.url):
            logger.error("scan_error url=%s reason=invalid_url", request.url)
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid URL. Use a full http/https URL."},
            )

        scan_phase_started_at = time.perf_counter()
        scan_result = scan_website(request.url, max_pages=request.max_pages)
        scan_duration_ms = (time.perf_counter() - scan_phase_started_at) * 1000
        logger.info("scan_duration url=%s duration_ms=%.2f", request.url, scan_duration_ms)

        raw_violations = scan_result.get("violations", [])
        violations = raw_violations if isinstance(raw_violations, list) else []
        severity_counts = {
            "critical": 0,
            "serious": 0,
            "moderate": 0,
            "minor": 0,
        }
        for violation in violations:
            if not isinstance(violation, dict):
                continue
            impact = violation.get("impact")
            if isinstance(impact, str) and impact in severity_counts:
                severity_counts[impact] += 1

        ai_phase_started_at = time.perf_counter()
        enriched_violations = run_parallel(
            _process_violation,
            [(violation, request.repo_path) for violation in violations if isinstance(violation, dict)],
            max_workers=5,
        )
        ai_duration_ms = (time.perf_counter() - ai_phase_started_at) * 1000
        logger.info("ai_processing_duration url=%s duration_ms=%.2f", request.url, ai_duration_ms)

        duplicate_counts: dict[str, int] = defaultdict(int)
        for violation in enriched_violations:
            duplicate_key = f"{violation['id']}::{violation['description']}"
            duplicate_counts[duplicate_key] += 1
        for violation in enriched_violations:
            duplicate_key = f"{violation['id']}::{violation['description']}"
            violation["duplicate_occurrences"] = duplicate_counts[duplicate_key]

        signatures = build_issue_signatures(enriched_violations)
        regressions, changelog = record_scan(
            request.url,
            total_violations=len(enriched_violations),
            signatures=signatures,
        )

        grouped_issues = _group_issues(enriched_violations)
        response = ScanResponse(
            url=request.url,
            scan_time=datetime.now(timezone.utc).isoformat(),
            total_violations=len(enriched_violations),
            scanned_pages=[page["url"] for page in scan_result.get("scanned_pages", [])],
            severity_counts=severity_counts,
            grouped_issues=grouped_issues,
            regressions=regressions,
            changelog=changelog,
            violations=sorted(
                enriched_violations,
                key=lambda item: (item["priority_score"], item["duplicate_occurrences"]),
                reverse=True,
            ),
        )
        duration_ms = (time.perf_counter() - request_started_at) * 1000
        logger.info(
            "scan_end url=%s total_violations=%d duration_ms=%.2f",
            request.url,
            response.total_violations,
            duration_ms,
        )
        return response
    except Exception:
        duration_ms = (time.perf_counter() - request_started_at) * 1000
        logger.exception("scan_error url=%s duration_ms=%.2f", request.url, duration_ms)
        return JSONResponse(
            status_code=500,
            content={"error": "Scan failure."},
        )


@app.post("/explain", response_model=ExplainResponse)
def explain(request: ExplainRequest) -> ExplainResponse:
    try:
        prompt = build_explainer_prompt(request.topic)
        result = get_ai_fix(prompt)
        return ExplainResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=8080, reload=True)
