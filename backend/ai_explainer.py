import json
import os
import re
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
    "explanation": "This element does not meet accessibility standards and may not be usable by assistive technologies.",
    "impact": "Users relying on screen readers or assistive tools may not be able to understand or interact with this element.",
    "fixed_html": "<!-- Fix could not be generated automatically -->",
}


def _extract_content(response_json: dict[str, Any]) -> str:
    choices = response_json.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("Model response contains no choices")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise ValueError("Model response choice is malformed")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise ValueError("Model response message is missing")

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


def _extract_first_json_object(text: str) -> str | None:
    # Regex-based extraction of the first JSON-like object block.
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    candidate = match.group(0)
    return candidate.strip()


def _parse_json_content(raw_text: str, provider_name: str) -> dict[str, Any]:
    cleaned = _extract_json_text(raw_text).strip()

    # Remove leading/trailing noise and keep only the first {...} block.
    candidate = _extract_first_json_object(cleaned)
    if not candidate:
        print(f"{provider_name} PARSE_FAILED: no JSON object found")
        raise ValueError(f"{provider_name} content is not valid JSON")

    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as exc:
        print(f"{provider_name} PARSE_FAILED: {exc}")
        raise ValueError(f"{provider_name} content is not valid JSON") from exc
    if isinstance(parsed, dict):
        print("PARSED:", parsed)
        return parsed

    print(f"{provider_name} PARSE_FAILED: parsed content is not a JSON object")
    raise ValueError(f"{provider_name} content is not valid JSON")


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
    providers = (("DeepSeek", call_deepseek), ("Gemma", call_gemma))
    for provider_name, provider in providers:
        try:
            print(f"Using {provider_name}...")
            raw = provider(prompt)
            print("RAW:", raw)
            parsed = _parse_json_content(raw, provider_name)
            return _normalize_result(parsed)
        except Exception as exc:
            print(f"{provider_name} parse/call error: {exc}")
            continue

    return dict(FALLBACK_RESULT)


def explain_topic(topic: str) -> str:
    """Compatibility helper used by the /explain endpoint."""
    prompt = build_explainer_prompt(topic)
    result = get_ai_fix(prompt)
    return result["explanation"]
