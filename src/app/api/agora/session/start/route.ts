import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startAgoraAgentSession } from "@/lib/agora-agent-client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    const body = await req.json();
    const { channelName, propertySlug, propertyId, userUid } = body || {};
    const callerType: "buyer_inquiry" | "owner_onboarding" =
      body?.callerType === "owner_onboarding" ? "owner_onboarding" : "buyer_inquiry";

    // Owner onboarding is only reachable from the authenticated studio; buyer calls stay public.
    if (callerType === "owner_onboarding" && !sessionUser) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    // The signed-in identity always wins over client-supplied values.
    const ownerName = sessionUser?.name ?? body?.ownerName ?? null;
    const ownerEmail = sessionUser?.email ?? body?.ownerEmail ?? null;
    const userId = sessionUser?.id ?? body?.userId ?? null;

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
      callerType,
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
