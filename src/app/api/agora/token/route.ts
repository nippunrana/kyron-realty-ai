import { NextRequest, NextResponse } from "next/server";
import { generateAgoraRtcToken } from "@/lib/agora-token";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channelName = body?.channelName || `kyron-call-${Date.now()}`;
    const uid = Number(body?.uid) || 1001;

    const tokenData = generateAgoraRtcToken(channelName, uid);

    return NextResponse.json({
      success: true,
      data: tokenData,
    });
  } catch (error: any) {
    console.error("Agora token endpoint error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate Agora token." },
      { status: 500 }
    );
  }
}
