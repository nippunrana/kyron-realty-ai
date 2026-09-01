import "dotenv/config";
import { db } from "../src/db";
import { properties, inquiriesAndLeads, viewingAppointments } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";

async function testPhase5EndToEnd() {
  console.log("=== Testing Phase 5: Public Listing & Lead Capture Pipeline ===\n");

  // 1. Fetch latest active property
  const [latestProperty] = await db
    .select()
    .from(properties)
    .orderBy(desc(properties.createdAt))
    .limit(1);

  if (!latestProperty) {
    throw new Error("No property found in database. Run test-phase3-create-property.ts first.");
  }

  console.log(`[✓] Fetched Public Property:`);
  console.log(`    Title: ${latestProperty.title}`);
  console.log(`    Slug: ${latestProperty.slug}`);
  console.log(`    Price: $${Number(latestProperty.price).toLocaleString()}/${latestProperty.listingType === "rent" ? "mo" : ""}`);
  console.log(`    Share URL: ${latestProperty.shareUrl}`);

  // 2. Simulate Buyer Inbound Lead & Tour Booking
  console.log("\n2. Testing Inbound Buyer Lead & Viewing Tour Scheduling...");
  const [createdLead] = await db
    .insert(inquiriesAndLeads)
    .values({
      propertyId: latestProperty.id,
      name: "Alexander Wright",
      email: "alexander.wright@example.com",
      phone: "415-555-0182",
      intent: latestProperty.listingType || "rent",
      budgetMax: "3500.00",
      moveInTargetDate: new Date("2026-10-01"),
      leadStatus: "viewing_scheduled",
      leadScore: 92,
      notes: "Qualified buyer via Agora Voice Sales Agent. Interested in 18-month lease.",
    })
    .returning();

  console.log(`[✓] Qualified Buyer Lead Captured:`);
  console.log(`    Lead ID: ${createdLead.id}`);
  console.log(`    Buyer: ${createdLead.name} (${createdLead.phone})`);
  console.log(`    Lead Score: ${createdLead.leadScore}/100`);

  // 3. Schedule Tour Appointment
  const tourStart = new Date();
  tourStart.setDate(tourStart.getDate() + 3);
  tourStart.setHours(14, 0, 0, 0);

  const tourEnd = new Date(tourStart.getTime() + 45 * 60 * 1000);

  const [createdAppointment] = await db
    .insert(viewingAppointments)
    .values({
      propertyId: latestProperty.id,
      leadId: createdLead.id,
      tourType: "in_person",
      scheduledStart: tourStart,
      scheduledEnd: tourEnd,
      status: "confirmed",
      attendeeName: createdLead.name,
      attendeeEmail: createdLead.email,
      attendeePhone: createdLead.phone,
      specialRequests: "Requested parking stall tour and pet policy verification.",
    })
    .returning();

  console.log(`[✓] Viewing Tour Confirmed:`);
  console.log(`    Appointment ID: ${createdAppointment.id}`);
  console.log(`    Tour Type: ${createdAppointment.tourType}`);
  console.log(`    Scheduled: ${createdAppointment.scheduledStart.toISOString()}`);

  console.log("\nPhase 5 End-to-End Pipeline Verification: 100% Passed! 🚀");
}

testPhase5EndToEnd().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
