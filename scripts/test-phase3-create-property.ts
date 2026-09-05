import "dotenv/config";
import { db } from "../src/db";
import { properties, propertyKnowledgeBases, negotiationMatrices } from "../src/db/schema";
import QRCode from "qrcode";

async function testPropertyCreation() {
  console.log("=== Testing Phase 3 Property Creation in Database ===\n");

  const sampleTitle = "Luxury 2-Bedroom Marina Loft with Golden Gate Views";
  const slug = `marina-luxury-loft-${Date.now().toString(36)}`;
  const shareUrl = `https://egnitech.com/projects/kyron-realty-ai/listings/${slug}`;

  // Generate vector QR code
  const qrCodeSvg = await QRCode.toString(shareUrl, {
    type: "svg",
    margin: 2,
  });

  // Insert Property
  const [createdProperty] = await db
    .insert(properties)
    .values({
      slug,
      title: sampleTitle,
      description: "Stunning high-floor residence featuring panoramic views of the bay.",
      listingType: "rent",
      propertyType: "apartment",
      status: "active",
      price: "3450.00",
      securityDeposit: "3450.00",
      minLeaseMonths: 12,
      hoaFeeMonthly: "0.00",
      address: "250 Marina Boulevard",
      unitNumber: "Unit 4B",
      city: "San Francisco",
      state: "CA",
      zipCode: "94123",
      country: "USA",
      bedrooms: 2,
      bathrooms: "2.0",
      sqft: 1150,
      yearBuilt: 2021,
      coverImageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      ],
      amenities: ["In-unit W/D", "Garage Parking", "EV Charging", "Balcony"],
      qrCodeSvg,
      shareUrl,
      onboardingSource: "conversational_wizard",
    })
    .returning();

  console.log(`[✓] Property Inserted (ID: ${createdProperty.id})`);
  console.log(`    Title: ${createdProperty.title}`);
  console.log(`    Slug: ${createdProperty.slug}`);
  console.log(`    Share URL: ${createdProperty.shareUrl}`);

  // Insert Knowledge Base
  await db.insert(propertyKnowledgeBases).values({
    propertyId: createdProperty.id,
    rawScrapedMarkdown: "# 250 Marina Boulevard Listing",
    synthesizedSalesPitch: "Welcome to 250 Marina Blvd with panoramic bay views and garage parking.",
    neighborhoodSummary: "Prime Marina location with 98 WalkScore.",
    petPolicyDetail: "Dogs and cats welcome with deposit.",
    parkingDetail: "1 assigned underground garage parking stall.",
    utilitiesDetail: "Water and trash included. Tenant pays electric and WiFi.",
    faqs: [
      {
        question: "Is parking included?",
        answer: "Yes, one assigned garage parking spot with EV charging.",
        category: "Amenities & Specs",
      },
    ],
    agentTone: "warm_professional",
    greetingMessage: "Hello! Thanks for checking out 250 Marina Blvd.",
  });
  console.log(`[✓] Knowledge Base Attached (Property ID: ${createdProperty.id})`);

  // Insert Negotiation Matrix
  await db.insert(negotiationMatrices).values({
    propertyId: createdProperty.id,
    allowNegotiation: true,
    targetPrice: "3450.00",
    minFloorPrice: "3250.00",
    maxAllowedDiscountPct: "5.00",
    concessionRules: [
      {
        condition: "18_month_lease",
        concession: "5% discount on monthly rent",
        maxConcessionValue: 173,
        requiresApproval: false,
      },
    ],
    notesForAgent: "Strictly adhere to $3,250 floor price.",
  });
  console.log(`[✓] Negotiation Matrix Attached (Floor Price: $3,250)`);

  console.log("\nPhase 3 Verification: 100% Passed! 🚀");
}

testPropertyCreation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
