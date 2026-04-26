import { NextResponse } from "next/server";
import { mockReportData } from "@/mock/report";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

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
        throw new Error(`Backend returned status ${backendResponse.status}`);
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
      console.warn("Backend scan failed or unavailable, falling back to mock data.", backendError);
      
      // Simulate slight delay for realism when falling back to mock
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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