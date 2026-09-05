import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiriesAndLeads, viewingAppointments, properties } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Public endpoint: every free-text field is trimmed and length-capped before it reaches the DB. */
const text = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertySlug, propertyId } = body || {};
    const name = text(body?.name, 120);
    const email = text(body?.email, 255);
    const phone = text(body?.phone, 40);
    const intent = text(body?.intent, 20);
    const tourType = text(body?.tourType, 30);
    const notes = text(body?.notes, 2000);
    const budgetMax = Number(body?.budgetMax);
    const moveInTargetDate = parseDate(body?.moveInTargetDate);
    const scheduledStart = parseDate(body?.scheduledStart);

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required." },
        { status: 400 }
      );
    }

    // Resolve property ID
    let resolvedPropertyId = propertyId;
    if (!resolvedPropertyId && propertySlug) {
      const [prop] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.slug, propertySlug))
        .limit(1);
      resolvedPropertyId = prop?.id;
    }

    if (!resolvedPropertyId) {
      return NextResponse.json(
        { error: "Valid property ID or slug is required." },
        { status: 400 }
      );
    }

    // 1. Insert Inquiries & Leads
    const [lead] = await db
      .insert(inquiriesAndLeads)
      .values({
        propertyId: resolvedPropertyId,
        name,
        email: email || null,
        phone,
        intent: intent || "rent",
        budgetMax: Number.isFinite(budgetMax) && budgetMax > 0 ? String(budgetMax) : null,
        moveInTargetDate,
        leadStatus: scheduledStart ? "viewing_scheduled" : "new",
        leadScore: scheduledStart ? 85 : 60,
        notes: notes || "Captured via public listing engagement",
      })
      .returning();

    // 2. Insert Viewing Appointment (if scheduled)
    let appointment = null;
    if (scheduledStart) {
      const start = scheduledStart;
      const end = new Date(start.getTime() + 45 * 60 * 1000); // 45-minute tour

      const [appt] = await db
        .insert(viewingAppointments)
        .values({
          propertyId: resolvedPropertyId,
          leadId: lead.id,
          tourType: tourType || "in_person",
          scheduledStart: start,
          scheduledEnd: end,
          status: "confirmed",
          attendeeName: name,
          attendeeEmail: email || null,
          attendeePhone: phone,
          specialRequests: notes || null,
        })
        .returning();
      appointment = appt;
    }

    return NextResponse.json({
      success: true,
      lead,
      appointment,
      message: appointment
        ? "Viewing appointment confirmed successfully!"
        : "Lead inquiry submitted successfully!",
    });
  } catch (error: any) {
    console.error("Lead capture route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to capture lead." },
      { status: 500 }
    );
  }
}
