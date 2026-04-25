from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class ScanRequest(StrictModel):
    url: str = Field(..., min_length=1, description="Target URL to scan")
    repo_path: str | None = Field(
        default=None,
        description="Optional local repo path for file and line mapping",
    )
    max_pages: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum same-origin pages to scan for duplicates and prioritization",
    )


class SourceLocation(StrictModel):
    file_path: str = ""
    line_number: int | None = None
    framework: str = ""
    snippet: str = ""
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class DeveloperPatch(StrictModel):
    language: str = ""
    title: str = ""
    code: str = ""
    commit_message: str = ""
    pr_summary: str = ""


class ViolationItem(StrictModel):
    id: str
    impact: str | None = None
    description: str
    element_html: str
    target: list[str] = Field(default_factory=list)
    failure_summary: str = ""
    help_url: str = ""
    page_url: str = ""
    page_title: str = ""
    wcag_tags: list[str] = Field(default_factory=list)
    affected_users: list[str] = Field(default_factory=list)
    business_priority: str = ""
    priority_score: int = 0
    duplicate_occurrences: int = 1
    source: SourceLocation = Field(default_factory=SourceLocation)
    patch: DeveloperPatch = Field(default_factory=DeveloperPatch)
    ai_explanation: str
    ai_impact: str
    ai_fix: str


class IssueGroup(StrictModel):
    key: str
    id: str
    description: str
    impact: str | None = None
    business_priority: str = ""
    affected_users: list[str] = Field(default_factory=list)
    wcag_tags: list[str] = Field(default_factory=list)
    total_occurrences: int = 0
    pages: list[str] = Field(default_factory=list)
    recommended_fix: str = ""


class RegressionSummary(StrictModel):
    new_issues: int = 0
    resolved_issues: int = 0
    unchanged_issues: int = 0
    previous_scan_time: str = ""


class ChangelogEntry(StrictModel):
    scan_time: str
    total_violations: int
    new_issues: int = 0
    resolved_issues: int = 0


class ScanResponse(StrictModel):
    url: str = Field(..., min_length=1)
    scan_time: str = Field(..., min_length=1)
    total_violations: int = Field(..., ge=0)
    scanned_pages: list[str] = Field(default_factory=list)
    severity_counts: dict[str, int] = Field(default_factory=dict)
    grouped_issues: list[IssueGroup] = Field(default_factory=list)
    regressions: RegressionSummary = Field(default_factory=RegressionSummary)
    changelog: list[ChangelogEntry] = Field(default_factory=list)
    violations: list[ViolationItem] = Field(default_factory=list)


class ExplainRequest(StrictModel):
    topic: str = Field(..., description="Topic to explain")


class ExplainResponse(StrictModel):
    explanation: str
    impact: str
    fixed_html: str
