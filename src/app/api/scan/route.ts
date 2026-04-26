import { NextResponse } from "next/server";
import { mockReportData } from "@/mock/report";

const BACKEND_URL = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:8080";
const ENABLE_MOCK_SCAN_FALLBACK =
  process.env.ENABLE_MOCK_SCAN_FALLBACK === "true";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, max_pages = 3 } = body;
    const normalizedUrl = typeof url === "string" ? url.trim() : "";

    if (!normalizedUrl) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Please provide a valid URL" },
        { status: 400 }
      );
    }

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          max_pages: max_pages,
        }),
      });

      if (!backendResponse.ok) {
        const backendError = await backendResponse
          .json()
          .catch(() => ({ error: `Backend returned status ${backendResponse.status}` }));

        return NextResponse.json(
          {
            success: false,
            error: backendError?.error || `Backend returned status ${backendResponse.status}`,
          },
          { status: backendResponse.status }
        );
      }

      const scanData = await backendResponse.json();

      console.log("[API /scan] Backend returned:", {
        url: scanData.url,
        total_violations: scanData.total_violations,
        violations_count: scanData.violations?.length,
      });

      const mappedIssues = (scanData.violations || []).map((v: any, index: number) => ({
        id: v.id || `v-${index}`,
        title: v.description || "Issue",
        severity: v.impact === "critical" ? "critical" : (v.impact === "serious" ? "critical" : (v.impact === "minor" ? "minor" : "moderate")),
        impact: v.ai_impact || "Unknown impact",
        description: v.failure_summary || "No description",
        suggestedFix: v.ai_explanation || "No suggested fix",
        codeSnippet: {
            current: v.element_html || "",
            fixed: v.ai_fix || ""
        },
        file: v.source?.file_path || "Unknown file",
        lineNumber: v.source?.line_number || 0,
        elementDescription: "Unknown element",
        wcagRule: v.wcag_tags?.[0] || "WCAG 2.1",
        affectedUsers: v.affected_users?.length ? (v.affected_users.length * 100) : 500,
        businessPriority: v.business_priority === "P0" || v.business_priority === "P1" ? "critical" : (v.business_priority === "P2" ? "high" : "medium"),
        isDuplicate: v.duplicate_occurrences > 1,
        duplicateCount: v.duplicate_occurrences
      }));

      const mappedData = {
          score: Math.max(0, 100 - ((scanData.total_violations || 0) * 2)),
          url: scanData.url || normalizedUrl,
          timestamp: scanData.scan_time || new Date().toISOString(),
          passedChecks: 50,
          totalChecks: 50 + (scanData.total_violations || 0),
          issues: mappedIssues,
          aiSuggestions: []
      };

      return NextResponse.json({
        success: true,
        data: mappedData,
        requestMeta: {
          capturedUrl: normalizedUrl,
        },
      });
    } catch (backendError) {
      if (!ENABLE_MOCK_SCAN_FALLBACK) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Backend scan service is unavailable. Ensure backend is running and BACKEND_URL is correct.",
          },
          { status: 502 }
        );
      }

      console.warn(
        "Backend scan failed or unavailable, falling back to mock data.",
        backendError
      );

      // Simulate slight delay for realism when falling back to mock.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        success: true,
        data: {
          ...mockReportData,
          url: normalizedUrl,
        },
        requestMeta: {
          capturedUrl: normalizedUrl,
        },
      });
    }
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process scan request" },
      { status: 500 }
    );
  }
}