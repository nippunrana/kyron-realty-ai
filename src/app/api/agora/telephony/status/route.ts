import { NextRequest, NextResponse } from "next/server";
import { getManagerCallSession } from "@/lib/agora-telephony";

export async function GET(req: NextRequest) {
  const channelName = req.nextUrl.searchParams.get("channelName");
  if (!channelName) {
    return NextResponse.json({ error: "Missing channelName parameter." }, { status: 400 });
  }

  const session = await getManagerCallSession(channelName);
  if (!session) {
    return NextResponse.json({ active: false, status: "idle" });
  }

  return NextResponse.json({
    active: true,
    status: session.status,
    callSid: session.callSid,
    propertyTitle: session.propertyTitle,
    createdAt: session.createdAt,
    transcripts: session.transcripts || [],
  });
}
