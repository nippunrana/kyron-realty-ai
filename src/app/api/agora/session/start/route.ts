import { NextRequest, NextResponse } from "next/server";
import { startAgoraAgentSession } from "@/lib/agora-agent-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelName, propertySlug, propertyId, userUid } = body || {};

    const resolvedChannelName =
      channelName || `listing-${propertySlug || "call"}-${Date.now().toString(36)}`;

    const sessionResult = await startAgoraAgentSession({
      channelName: resolvedChannelName,
      propertySlug,
      propertyId,
      userUid: Number(userUid) || 1001,
    });

    return NextResponse.json(sessionResult);
  } catch (error: any) {
    console.error("Agora start session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start Agora agent session." },
      { status: 500 }
    );
  }
}
