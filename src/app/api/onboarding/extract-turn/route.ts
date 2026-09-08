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
    const { slidingWindowMessages, currentPropertyState, currentKnowledgeBase, currentHyperLocalData } = body || {};

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
      currentHyperLocalData,
    });

    const durationMs = Date.now() - startTime;
    console.log(
      `[API extract-turn] 200 OK (${durationMs}ms) - Updated: [${Object.keys(result.updates).join(", ")}] - ${result.usage?.totalTokens || 0} tokens (${result.usage?.costFormatted || "$0"})`
    );

    return NextResponse.json({
      success: true,
      data: result,
      usage: result.usage,
      latencyMs: durationMs,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Failed to extract turn specifications.";
    console.error(`[API extract-turn Error] (${durationMs}ms):`, error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        latencyMs: durationMs,
      },
      { status: 500 }
    );
  }
}
