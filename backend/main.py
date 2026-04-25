import logging
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from ai_explainer import get_ai_fix
from models import ExplainRequest, ExplainResponse, ScanRequest
from prompt_builder import build_explainer_prompt
from scanner import scan_website


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


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return """
    <!doctype html>
    <html lang=\"en\">
      <head>
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <title>Lumio Backend</title>
        <style>
          :root {
            --bg: linear-gradient(135deg, #f6f9fc 0%, #e8f1ff 100%);
            --card: #ffffff;
            --text: #1d2939;
            --muted: #667085;
            --border: #d0d5dd;
            --focus: #1570ef;
          }

          body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            color: var(--text);
            background: var(--bg);
            display: grid;
            place-items: center;
            padding: 24px;
          }

          .card {
            width: min(560px, 100%);
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 12px 28px rgba(16, 24, 40, 0.12);
            padding: 24px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 1.5rem;
          }

          p {
            margin: 0 0 16px;
            color: var(--muted);
          }

          .input-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
          }

          .input-box {
            width: 100%;
            padding: 12px 14px;
            font-size: 1rem;
            border: 1px solid var(--border);
            border-radius: 10px;
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
            box-sizing: border-box;
          }

          .input-box:focus {
            border-color: var(--focus);
            box-shadow: 0 0 0 4px rgba(21, 112, 239, 0.2);
          }
        </style>
      </head>
      <body>
        <section class=\"card\">
          <h1>Lumio Backend</h1>
          <p>FastAPI service is running.</p>
          <label class=\"input-label\" for=\"prompt\">Input</label>
          <input id=\"prompt\" class=\"input-box\" type=\"text\" placeholder=\"Type something...\" />
        </section>
      </body>
    </html>
    """


@app.post("/scan")
def scan(request: ScanRequest) -> dict[str, object]:
  try:
    return scan_website(request.url)
  except ValueError as exc:
    raise HTTPException(status_code=400, detail=str(exc)) from exc
  except RuntimeError as exc:
    raise HTTPException(status_code=504, detail=str(exc)) from exc
  except Exception as exc:
    raise HTTPException(status_code=500, detail=str(exc)) from exc


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
