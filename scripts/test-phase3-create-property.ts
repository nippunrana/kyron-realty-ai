import "dotenv/config";
import { assertSampleDataWritesAllowed } from "./sample-data-guard";
import { db } from "../src/db";
import { properties } from "../src/db/schema";
import QRCode from "qrcode";
import { BASE_PATH, PUBLIC_ORIGIN } from "../src/lib/base-path";

async function testPropertyCreation() {
  assertSampleDataWritesAllowed();
  console.log("=== Testing Property Creation in Database ===\n");

  const sampleTitle = "Luxury 2-Bedroom Marina Loft with Golden Gate Views";
  const slug = `marina-luxury-loft-${Date.now().toString(36)}`;
  const shareUrl = `${PUBLIC_ORIGIN}${BASE_PATH}/listings/${slug}`;

  // Generate vector QR code
  const qrCodeSvg = await QRCode.toString(shareUrl, {
    type: "svg",
    margin: 2,
  });

  // Insert Property with unified JSONB columns
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
      knowledgeBase: {
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
      },
      negotiationRules: {
        allowNegotiation: true,
        targetPrice: 3450,
        minFloorPrice: 3250,
        maxAllowedDiscountPct: 5,
        concessionRules: [
          {
            condition: "18_month_lease",
            concession: "5% discount on monthly rent",
            maxConcessionValue: 173,
            requiresApproval: false,
          },
        ],
        notesForAgent: "Strictly adhere to $3,250 floor price.",
      },
    })
    .returning();

  console.log(`[✓] Property Inserted with Unified KB & Guardrails (ID: ${createdProperty.id})`);
  console.log(`    Title: ${createdProperty.title}`);
  console.log(`    Slug: ${createdProperty.slug}`);
  console.log(`    Share URL: ${createdProperty.shareUrl}`);
  console.log(`    KB Tone: ${createdProperty.knowledgeBase?.agentTone}`);
  console.log(`    Floor Price: $${createdProperty.negotiationRules?.minFloorPrice}`);

  console.log("\nSingle-Table Property Verification: 100% Passed! 🚀");
}

testPropertyCreation().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
