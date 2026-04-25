from typing import Any


def build_explainer_prompt(topic: str) -> str:
    """Build a concise prompt for AI explanation tasks."""
    return (
        "You are an expert assistant. "
        f"Explain the following topic clearly for a beginner: {topic}"
    )


def build_prompt(v: dict[str, Any]) -> str:
    """Build a strict JSON-only accessibility remediation prompt from a violation."""
    nodes = v.get("nodes")
    element_html = ""
    if isinstance(nodes, list) and nodes and isinstance(nodes[0], dict):
        element_html = str(nodes[0].get("html") or "")

    violation_id = str(v.get("id") or "unknown")
    description = str(v.get("description") or "No description provided")
    impact = str(v.get("impact") or "unknown")
    description_lower = description.lower()

    extra_rules: list[str] = []
    if violation_id == "image-alt":
        extra_rules.append(
            "- If issue ID is image-alt, generate meaningful alt text from page context; never use generic alt text like 'image' or 'photo'."
        )

    has_unlabeled_control = (
        violation_id in {"button-name", "link-name"}
        or "button" in description_lower
        or "link" in description_lower
        or "label" in description_lower
    )
    if has_unlabeled_control:
        extra_rules.append(
            "- If a button or link has no accessible label, infer its purpose from context and provide a clear, action-oriented label."
        )

    extra_rules_text = "\n".join(extra_rules)

    prompt = f"""You are an accessibility expert.

Return ONLY valid JSON. No markdown. No explanations outside JSON.

Strict format:
{{
\"explanation\": \"Explain clearly in simple English what is wrong (max 2 sentences).\",
\"impact\": \"Explain who is affected and how (must mention users like blind users, screen reader users, etc).\",
\"fixed_html\": \"Return ONLY the corrected version of the given element.\"
}}

Rules:
- Do NOT return anything outside JSON
- Do NOT include backticks
- Do NOT explain JSON
- Keep explanation simple and human readable
- Impact MUST mention affected users explicitly
- Do NOT repeat the input text verbatim in explanation
- Be specific and concrete, not generic
- Keep response natural and human
{extra_rules_text}

Violation:
ID: {violation_id}
Description: {description}
Impact: {impact}
Element: {element_html}
"""

    forbidden_placeholders = ("{id}", "{description}", "{impact}", "{html}")
    if any(token in prompt for token in forbidden_placeholders):
        raise ValueError("Prompt still contains unresolved placeholders")

    print("PROMPT SENT:", prompt)
    return prompt
