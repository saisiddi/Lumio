import json
import os
import re
from typing import Any

import requests
from dotenv import load_dotenv

from prompt_builder import build_explainer_prompt

load_dotenv()

NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions"
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
NVIDIA_MODEL = "deepseek-ai/deepseek-v4-pro"
OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free"
REQUEST_TIMEOUT_SECONDS = 20

FALLBACK_RESULT: dict[str, str] = {
    "explanation": "This element does not meet accessibility standards and may not be usable by assistive technologies.",
    "impact": "Users relying on screen readers or assistive tools may not be able to understand or interact with this element.",
    "fixed_html": "<!-- Fix could not be generated automatically -->",
}

RULE_BASED_FALLBACKS: dict[str, dict[str, str]] = {
    "html-has-lang": {
        "explanation": "The page is missing a language declaration on the html element, so assistive tools cannot reliably choose the right pronunciation rules.",
        "impact": "Screen reader users, blind users, and multilingual users may hear text announced with the wrong language settings, making content harder to understand.",
        "fixed_html": '<html lang="en">',
    },
    "landmark-one-main": {
        "explanation": "The page does not expose a main landmark, so users cannot quickly jump to the primary content area.",
        "impact": "Screen reader users and keyboard users lose a common shortcut for skipping repeated navigation and reaching the main content faster.",
        "fixed_html": "<main>\n  <!-- Primary page content -->\n</main>",
    },
    "page-has-heading-one": {
        "explanation": "The page is missing a top-level heading, which makes it harder to understand the main purpose of the page.",
        "impact": "Screen reader users and users with cognitive disabilities may struggle to orient themselves because there is no clear first heading that summarizes the page.",
        "fixed_html": "<h1>Page title</h1>",
    },
    "region": {
        "explanation": "Some visible content is not wrapped in a landmark region, so assistive technologies cannot expose it as part of the page structure.",
        "impact": "Screen reader users and keyboard users may have trouble navigating the page efficiently because this section is not grouped under a meaningful landmark.",
        "fixed_html": "<section aria-label=\"Content section\">\n  <!-- Section content -->\n</section>",
    },
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


def get_rule_based_fallback(violation_id: str) -> dict[str, str]:
    return dict(RULE_BASED_FALLBACKS.get(violation_id, FALLBACK_RESULT))


def _post_chat_completion(
    *,
    endpoint: str,
    api_key: str,
    model: str,
    prompt: str,
    extra_headers: dict[str, str] | None = None,
) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }

    response = requests.post(
        endpoint,
        headers=headers,
        json=payload,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return _extract_content(response.json())


def call_nvidia(prompt: str) -> str:
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_API_KEY is not set")

    return _post_chat_completion(
        endpoint=NVIDIA_ENDPOINT,
        api_key=api_key,
        model=NVIDIA_MODEL,
        prompt=prompt,
    )


def call_gemma(prompt: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    return _post_chat_completion(
        endpoint=OPENROUTER_ENDPOINT,
        api_key=api_key,
        model=OPENROUTER_MODEL,
        prompt=prompt,
    )


def get_ai_fix(prompt: str) -> dict[str, str]:
    providers = (("OpenRouter Gemma", call_gemma), ("NVIDIA DeepSeek", call_nvidia))
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
