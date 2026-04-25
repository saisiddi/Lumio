import { NextResponse } from "next/server";
import { mockReportData } from "@/mock/report";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Simulate network delay and analysis time (e.g., 3-5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Return the mock report data
    // In a real application, this would call an external service or perform actual DOM analysis
    return NextResponse.json({
      success: true,
      data: mockReportData,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to scan URL" },
      { status: 500 }
    );
  }
}
