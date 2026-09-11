import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startAgoraAgentSession } from "@/lib/agora-agent-client";
import type { CallerType } from "@/hooks/voice-agent-types";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user;

    const body = await req.json();
    const { propertySlug, propertyId } = body || {};
    const callerType: CallerType =
      body?.callerType === "owner_onboarding"
        ? "owner_onboarding"
        : body?.callerType === "sales_agent"
        ? "sales_agent"
        : "buyer_inquiry";

    // Owner onboarding is only reachable from the authenticated studio; buyer and sales agent calls stay public.
    if (callerType === "owner_onboarding" && !sessionUser) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    // Identity comes from the session only; the request body carries none.
    // The channel name and caller UID are assigned here, never taken from the body.
    const ownerName = sessionUser?.name ?? null;
    const ownerEmail = sessionUser?.email ?? null;
    const userId = sessionUser?.id ?? null;

    const resolvedChannelName =
      callerType === "owner_onboarding"
        ? `onboard-owner-${Date.now().toString(36)}`
        : callerType === "sales_agent"
        ? `sales-sarah-${Date.now().toString(36)}`
        : `listing-${propertySlug || "call"}-${Date.now().toString(36)}`;

    // Generate unique UIDs per session so Agora RTM never collides on a hardcoded UID (prevents "Kicked off by remote session")
    const userUid = Math.floor(100000 + Math.random() * 800000);
    const agentUid = Math.floor(900000 + Math.random() * 99999);

    const sessionResult = await startAgoraAgentSession({
      channelName: resolvedChannelName,
      propertySlug,
      propertyId,
      callerType,
      ownerName,
      ownerEmail,
      userId,
      userUid,
      agentUid,
    });

    return NextResponse.json(sessionResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start Agora agent session.";
    console.error("Agora start session error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
