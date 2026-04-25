from pydantic import BaseModel, Field


class ScanRequest(BaseModel):
    url: str = Field(..., description="Target URL to scan")


class ExplainRequest(BaseModel):
    topic: str = Field(..., description="Topic to explain")


class ExplainResponse(BaseModel):
    explanation: str
    impact: str
    fixed_html: str
