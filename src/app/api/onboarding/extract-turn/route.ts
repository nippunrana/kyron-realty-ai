import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractTurnSpecs } from "@/lib/turn-extractor";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { slidingWindowMessages, currentPropertyState, currentKnowledgeBase } = body || {};

    if (!slidingWindowMessages || !Array.isArray(slidingWindowMessages) || slidingWindowMessages.length === 0) {
      return NextResponse.json({
        success: true,
        data: { updates: {}, modalAction: "none" },
        latencyMs: Date.now() - startTime,
      });
    }

    const result = await extractTurnSpecs({
      slidingWindowMessages,
      currentPropertyState,
      currentKnowledgeBase,
    });

    const durationMs = Date.now() - startTime;
    console.log(`[API extract-turn] 200 OK (${durationMs}ms) - Updated: [${Object.keys(result.updates).join(", ")}]`);

    return NextResponse.json({
      success: true,
      data: result,
      latencyMs: durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[API extract-turn Error] (${durationMs}ms):`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract turn specifications.",
        latencyMs: durationMs,
      },
      { status: 500 }
    );
  }
}
