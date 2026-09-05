import { NextRequest, NextResponse } from "next/server";
import { extractTurnSpecs } from "@/lib/kb-extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slidingWindowMessages, currentPropertyState } = body || {};

    if (!slidingWindowMessages || !Array.isArray(slidingWindowMessages) || slidingWindowMessages.length === 0) {
      return NextResponse.json({
        success: true,
        data: { updates: {}, modalAction: "none" },
      });
    }

    const result = await extractTurnSpecs({
      slidingWindowMessages,
      currentPropertyState,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Turn extraction route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract turn specifications.",
      },
      { status: 500 }
    );
  }
}
