def build_explainer_prompt(topic: str) -> str:
    """Build a concise prompt for AI explanation tasks."""
    return (
        "You are an expert assistant. "
        f"Explain the following topic clearly for a beginner: {topic}"
    )
