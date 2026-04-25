import logging
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_explainer import FALLBACK_RESULT, get_ai_fix, get_rule_based_fallback
from models import ExplainRequest, ExplainResponse, ScanRequest, ScanResponse
from prompt_builder import build_explainer_prompt, build_prompt
from scanner import scan_website
from utils import limit_violations, run_parallel


logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("lumio-backend")


app = FastAPI(title="lumio-backend", version="1.0.0")

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


@app.get("/health")
def health() -> dict[str, str]:
  return {"status": "ok"}


def _is_valid_url(url: str) -> bool:
  parsed = urlparse(url)
  return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _process_violation(violation: dict[str, object]) -> dict[str, object]:
  prompt = build_prompt(violation)
  ai_fix = get_ai_fix(prompt)
  violation_id = str(violation.get("id") or "unknown")

  if ai_fix == FALLBACK_RESULT:
    ai_fix = get_rule_based_fallback(violation_id)

  node_html = ""
  nodes = violation.get("nodes")
  if isinstance(nodes, list) and nodes and isinstance(nodes[0], dict):
    node_html = str(nodes[0].get("html") or "")

  return {
    "id": violation_id,
    "impact": str(violation.get("impact")) if violation.get("impact") is not None else None,
    "description": str(violation.get("description") or "No description provided"),
    "element_html": node_html,
    "ai_explanation": ai_fix.get("explanation", "Could not generate explanation."),
    "ai_impact": ai_fix.get("impact", "Unknown impact."),
    "ai_fix": ai_fix.get("fixed_html", ""),
  }


@app.get("/")
def home() -> dict[str, str]:
  return {
    "service": "lumio-backend",
    "status": "running",
    "health": "/health",
    "scan_endpoint": "/scan",
  }


@app.post("/scan", response_model=ScanResponse)
def scan(request: ScanRequest) -> ScanResponse:
  request_started_at = time.perf_counter()
  logger.info("scan_start url=%s", request.url)
  try:
    if not _is_valid_url(request.url):
      logger.error("scan_error url=%s reason=invalid_url", request.url)
      return JSONResponse(
        status_code=400,
        content={"error": "Invalid URL. Use a full http/https URL."},
      )

    scan_phase_started_at = time.perf_counter()
    scan_result = scan_website(request.url)
    scan_duration_ms = (time.perf_counter() - scan_phase_started_at) * 1000
    logger.info("scan_duration url=%s duration_ms=%.2f", request.url, scan_duration_ms)

    raw_violations = scan_result.get("violations", [])
    violations = raw_violations if isinstance(raw_violations, list) else []
    limited_violations = limit_violations(violations, limit=10)

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
    enriched_violations = run_parallel(_process_violation, limited_violations, max_workers=5)
    ai_duration_ms = (time.perf_counter() - ai_phase_started_at) * 1000
    logger.info("ai_processing_duration url=%s duration_ms=%.2f", request.url, ai_duration_ms)

    response = ScanResponse(
      url=request.url,
      scan_time=datetime.now(timezone.utc).isoformat(),
      total_violations=len(violations),
      severity_counts=severity_counts,
      violations=enriched_violations,
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

  uvicorn.run("main:app", host="localhost", port=8000, reload=True)
