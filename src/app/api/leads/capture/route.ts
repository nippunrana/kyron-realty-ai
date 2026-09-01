import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiriesAndLeads, viewingAppointments, properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      propertySlug,
      propertyId,
      name,
      email,
      phone,
      intent,
      budgetMax,
      moveInTargetDate,
      tourType,
      scheduledStart,
      notes,
    } = body || {};

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
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone.trim(),
        intent: intent || "rent",
        budgetMax: budgetMax ? String(budgetMax) : null,
        moveInTargetDate: moveInTargetDate ? new Date(moveInTargetDate) : null,
        leadStatus: scheduledStart ? "viewing_scheduled" : "new",
        leadScore: scheduledStart ? 85 : 60,
        notes: notes || "Captured via public listing engagement",
      })
      .returning();

    // 2. Insert Viewing Appointment (if scheduled)
    let appointment = null;
    if (scheduledStart) {
      const start = new Date(scheduledStart);
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
          attendeeName: name.trim(),
          attendeeEmail: email ? email.trim() : null,
          attendeePhone: phone.trim(),
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
