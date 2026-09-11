import { NextRequest, NextResponse } from "next/server";
import { getPropertyCalendarAvailability } from "@/lib/calendar-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Property ID or slug is required." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") || "7", 10);
    const daysAhead = Math.min(Math.max(daysParam, 1), 14);

    const result = await getPropertyCalendarAvailability(id, daysAhead);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load calendar availability.";
    console.error("[API Calendar Availability Error]:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
