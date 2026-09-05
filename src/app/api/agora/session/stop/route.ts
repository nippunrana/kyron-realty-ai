import { NextRequest, NextResponse } from "next/server";
import { stopAgoraAgentSession } from "@/lib/agora-agent-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, channelName } = body || {};

    if (!sessionId || !channelName) {
      return NextResponse.json(
        { error: "sessionId and channelName are required." },
        { status: 400 }
      );
    }

    const result = await stopAgoraAgentSession(String(sessionId), String(channelName));
    if (!result) {
      return NextResponse.json(
        { success: false, error: "No active voice session matches that id and channel." },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agora stop session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to stop Agora agent session." },
      { status: 500 }
    );
  }
}
