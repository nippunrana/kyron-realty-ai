import { NextRequest, NextResponse } from "next/server";
import { dialPropertyManager } from "@/lib/agora-telephony";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyId, channelName, prospectName } = body;

    if (!propertyId || typeof propertyId !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid propertyId." },
        { status: 400 }
      );
    }

    if (!channelName || typeof channelName !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid channelName." },
        { status: 400 }
      );
    }

    // Determine public host URL for Twilio webhook callbacks
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const hostUrl =
      process.env.TWILIO_WEBHOOK_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      `${proto}://${host}`;

    const result = await dialPropertyManager({
      propertyId,
      channelName,
      prospectName,
      hostUrl,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API Telephony Dial Manager] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dial property manager." },
      { status: 500 }
    );
  }
}
