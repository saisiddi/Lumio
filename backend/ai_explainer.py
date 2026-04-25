import json
import os
from typing import Any

import requests
from dotenv import load_dotenv

from prompt_builder import build_explainer_prompt

load_dotenv()

DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-v4-pro"
GEMMA_MODEL = "google/gemma-4-26b-a4b-it:free"
REQUEST_TIMEOUT_SECONDS = 10

FALLBACK_RESULT: dict[str, str] = {
    "explanation": "Could not generate explanation.",
    "impact": "Unknown impact.",
    "fixed_html": "",
}


def _extract_content(response_json: dict[str, Any]) -> str:
    choices = response_json.get("choices") or []
    if not choices:
        raise ValueError("Model response contains no choices")

    message = choices[0].get("message") or {}
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Model response content is empty")
    return content.strip()


def _extract_json_text(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].strip() == "```":
            return "\n".join(lines[1:-1]).strip()
    return text


def _normalize_result(data: dict[str, Any]) -> dict[str, str]:
    return {
        "explanation": str(data.get("explanation", FALLBACK_RESULT["explanation"])),
        "impact": str(data.get("impact", FALLBACK_RESULT["impact"])),
        "fixed_html": str(data.get("fixed_html", FALLBACK_RESULT["fixed_html"])),
    }


def call_deepseek(prompt: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    response = requests.post(
        DEEPSEEK_ENDPOINT,
        headers=headers,
        json=payload,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return _extract_content(response.json())


def call_gemma(prompt: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GEMMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    response = requests.post(
        OPENROUTER_ENDPOINT,
        headers=headers,
        json=payload,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return _extract_content(response.json())


def get_ai_fix(prompt: str) -> dict[str, str]:
    for provider in (call_deepseek, call_gemma):
        try:
            raw = provider(prompt)
            parsed = json.loads(_extract_json_text(raw))
            if isinstance(parsed, dict):
                return _normalize_result(parsed)
        except Exception:
            continue

    return dict(FALLBACK_RESULT)


def explain_topic(topic: str) -> str:
    """Compatibility helper used by the /explain endpoint."""
    prompt = build_explainer_prompt(topic)
    result = get_ai_fix(prompt)
    return result["explanation"]
