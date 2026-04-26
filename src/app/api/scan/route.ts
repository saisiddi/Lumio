import { NextResponse } from "next/server";

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

    const backendResponse = await fetch(`${BACKEND_URL}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: normalizedUrl,
        max_pages: max_pages,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { success: false, error: `Backend error: ${errorText}` },
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
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to scan URL" },
      { status: 500 }
    );
  }
}