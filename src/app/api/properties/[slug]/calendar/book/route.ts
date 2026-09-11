import { NextRequest, NextResponse } from "next/server";
import { bookPropertyTourSlot } from "@/lib/calendar-service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const cleanText = (val: unknown, maxLen = 255): string =>
  typeof val === "string" ? val.trim().slice(0, maxLen) : "";

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: "Property slug is required." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const date = cleanText(body.date, 20); // YYYY-MM-DD
    const time = cleanText(body.time, 20); // HH:00 or "2:00 PM"
    const attendeeName = cleanText(body.name || body.attendeeName, 120);
    const attendeePhone = cleanText(body.phone || body.attendeePhone, 40);
    const attendeeEmail = cleanText(body.email || body.attendeeEmail, 255);
    const notes = cleanText(body.notes, 1000);
    const voiceSessionId = typeof body.voiceSessionId === "number" ? body.voiceSessionId : null;

    if (!date || !time) {
      return NextResponse.json(
        { error: "Tour date and time are required." },
        { status: 400 }
      );
    }

    if (!attendeeName || !attendeePhone) {
      return NextResponse.json(
        { error: "Name and phone number are required to confirm a booking." },
        { status: 400 }
      );
    }

    const result = await bookPropertyTourSlot({
      propertySlugOrId: slug,
      date,
      time,
      attendeeName,
      attendeePhone,
      attendeeEmail: attendeeEmail || null,
      notes: notes || null,
      voiceSessionId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to book tour appointment.";
    console.error("[API Calendar Booking Error]:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
