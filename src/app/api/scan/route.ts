import { NextResponse } from "next/server";
import { mockReportData } from "@/mock/report";

const BACKEND_URL = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:8000";
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

      return NextResponse.json({
        success: true,
        data: scanData,
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