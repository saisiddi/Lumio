from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ScanRequest(StrictModel):
    url: str = Field(..., min_length=1, description="Target URL to scan")


class ViolationItem(StrictModel):
    id: str
    impact: str | None = None
    description: str
    element_html: str
    ai_explanation: str
    ai_impact: str
    ai_fix: str


class ScanResponse(StrictModel):
    url: str = Field(..., min_length=1)
    scan_time: str = Field(..., min_length=1)
    total_violations: int = Field(..., ge=0)
    severity_counts: dict[str, int] = Field(default_factory=dict)
    violations: list[ViolationItem] = Field(default_factory=list)


class ExplainRequest(StrictModel):
    topic: str = Field(..., description="Topic to explain")


class ExplainResponse(StrictModel):
    explanation: str
    impact: str
    fixed_html: str
