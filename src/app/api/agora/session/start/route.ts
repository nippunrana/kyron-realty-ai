import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startAgoraAgentSession } from "@/lib/agora-agent-client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    const body = await req.json();
    const { channelName, propertySlug, propertyId, userUid, callerType } = body || {};

    const ownerName = body?.ownerName ?? sessionUser?.name ?? null;
    const ownerEmail = body?.ownerEmail ?? sessionUser?.email ?? null;
    const userId = body?.userId ?? sessionUser?.id ?? null;

    const resolvedChannelName =
      channelName ||
      (callerType === "owner_onboarding"
        ? `onboard-owner-${Date.now().toString(36)}`
        : `listing-${propertySlug || "call"}-${Date.now().toString(36)}`);

    const sessionResult = await startAgoraAgentSession({
      channelName: resolvedChannelName,
      propertySlug,
      propertyId,
      userUid: Number(userUid) || 1001,
      callerType: callerType || "buyer_inquiry",
      ownerName,
      ownerEmail,
      userId,
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
