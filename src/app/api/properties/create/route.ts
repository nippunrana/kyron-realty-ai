import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  properties,
  propertyKnowledgeBases,
  negotiationMatrices,
  propertyMedia,
} from "@/db/schema";
import QRCode from "qrcode";
import { eq } from "drizzle-orm";
import { buildDefaultTitle, computeFloorPrice, parseAvailableDate, randomSlugSuffix, slugify } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const userId = session.user.id || null;

    const body = await req.json();
    const { property, knowledgeBase, negotiationMatrix, draftId } = body || {};

    if (property && !property.title && property.address) {
      property.title = buildDefaultTitle(property.address, property.bedrooms);
    }

    if (!property || !property.title || !property.price || !property.address || !property.listingType) {
      return NextResponse.json(
        { error: "Property title, price, address, and listing type are required." },
        { status: 400 }
      );
    }

    // Determine public URL with subpath
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

    let slug = property.slug || slugify(property.title);

    // Check if slug exists on another property
    const [existing] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.slug, slug))
      .limit(1);

    if (existing && (!draftId || existing.id !== Number(draftId))) {
      slug = `${slug}-${randomSlugSuffix()}`;
    }

    const shareUrl = `${protocol}://${host}${BASE_PATH}/listings/${slug}`;

    // Generate high-res vector QR code with explicit dimensions
    const qrCodeSvg = await QRCode.toString(shareUrl, {
      type: "svg",
      width: 256,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    let insertedProperty: typeof properties.$inferSelect | undefined;

    if (draftId) {
      const [updated] = await db
        .update(properties)
        .set({
          slug,
          title: property.title,
          description: property.description || "",
          listingType: property.listingType,
          propertyType: property.propertyType || "apartment",
          status: "active",
          price: String(property.price),
          securityDeposit: property.securityDeposit ? String(property.securityDeposit) : null,
          minLeaseMonths: property.minLeaseMonths ? Number(property.minLeaseMonths) : null,
          hoaFeeMonthly: property.hoaFeeMonthly ? String(property.hoaFeeMonthly) : "0",
          address: property.address,
          unitNumber: property.unitNumber || null,
          city: property.city || null,
          state: property.state || null,
          zipCode: property.zipCode || null,
          country: property.country || "India",
          bedrooms: property.bedrooms ? Number(property.bedrooms) : null,
          bathrooms: property.bathrooms ? String(property.bathrooms) : null,
          sqft: property.sqft ? Number(property.sqft) : null,
          yearBuilt: property.yearBuilt ? Number(property.yearBuilt) : null,
          availableDate: parseAvailableDate(property.availableDate),
          coverImageUrl: property.coverImageUrl || (property.images && property.images[0]) || null,
          images: property.images || [],
          amenities: property.amenities || [],
          features: property.features || [],
          qrCodeSvg,
          shareUrl,
          onboardingSource: property.onboardingSource || "conversational_wizard",
          sourceUrl: property.sourceUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, Number(draftId)))
        .returning();

      insertedProperty = updated;

      // Clean up previous draft knowledgebase & matrix rows if present to prevent duplicate conflicts
      if (insertedProperty) {
        await db.delete(propertyKnowledgeBases).where(eq(propertyKnowledgeBases.propertyId, insertedProperty.id));
        await db.delete(negotiationMatrices).where(eq(negotiationMatrices.propertyId, insertedProperty.id));
        await db.delete(propertyMedia).where(eq(propertyMedia.propertyId, insertedProperty.id));
      }
    }

    if (!insertedProperty) {
      // 1. Insert New Property
      const [inserted] = await db
        .insert(properties)
        .values({
          ownerId: userId,
          slug,
          title: property.title,
          description: property.description || "",
          listingType: property.listingType,
          propertyType: property.propertyType || "apartment",
          status: "active",
          price: String(property.price),
          securityDeposit: property.securityDeposit ? String(property.securityDeposit) : null,
          minLeaseMonths: property.minLeaseMonths ? Number(property.minLeaseMonths) : null,
          hoaFeeMonthly: property.hoaFeeMonthly ? String(property.hoaFeeMonthly) : "0",
          address: property.address,
          unitNumber: property.unitNumber || null,
          city: property.city || null,
          state: property.state || null,
          zipCode: property.zipCode || null,
          country: property.country || "India",
          bedrooms: property.bedrooms ? Number(property.bedrooms) : null,
          bathrooms: property.bathrooms ? String(property.bathrooms) : null,
          sqft: property.sqft ? Number(property.sqft) : null,
          yearBuilt: property.yearBuilt ? Number(property.yearBuilt) : null,
          availableDate: parseAvailableDate(property.availableDate),
          coverImageUrl: property.coverImageUrl || (property.images && property.images[0]) || null,
          images: property.images || [],
          amenities: property.amenities || [],
          features: property.features || [],
          qrCodeSvg,
          shareUrl,
          onboardingSource: property.onboardingSource || "conversational_wizard",
          sourceUrl: property.sourceUrl || null,
        })
        .returning();

      insertedProperty = inserted;
    }

    // 2. Insert Knowledge Base
    if (knowledgeBase) {
      const faqs = Array.isArray(knowledgeBase.faqs) ? [...knowledgeBase.faqs] : [];
      if (
        knowledgeBase.contactEmail &&
        !faqs.some(
          (f: { category?: string; question?: string }) =>
            f.category === "Contact" ||
            (f.question && f.question.toLowerCase().includes("contact email"))
        )
      ) {
        faqs.push({
          category: "Contact",
          question: "What is the contact email for inquiries?",
          answer: `You can reach the listing contact directly at ${knowledgeBase.contactEmail}.`,
        });
      }

      const applicationProcess = knowledgeBase.applicationProcess
        ? `${knowledgeBase.applicationProcess}${
            knowledgeBase.contactEmail && !knowledgeBase.applicationProcess.includes(knowledgeBase.contactEmail)
              ? ` (Contact: ${knowledgeBase.contactEmail})`
              : ""
          }`
        : knowledgeBase.contactEmail
        ? `Direct inquiry contact: ${knowledgeBase.contactEmail}`
        : "";

      await db.insert(propertyKnowledgeBases).values({
        propertyId: insertedProperty.id,
        city: property.city || knowledgeBase.city || null,
        state: property.state || knowledgeBase.state || null,
        listingType: property.listingType || knowledgeBase.listingType || "rent",
        price: property.price ? String(property.price) : null,
        rawScrapedMarkdown: knowledgeBase.rawScrapedMarkdown || "",
        synthesizedSalesPitch: knowledgeBase.synthesizedSalesPitch || "",
        neighborhoodSummary: knowledgeBase.neighborhoodSummary || "",
        schoolDistrictInfo: knowledgeBase.schoolDistrictInfo || "",
        petPolicyDetail: knowledgeBase.petPolicyDetail || "",
        parkingDetail: knowledgeBase.parkingDetail || "",
        utilitiesDetail: knowledgeBase.utilitiesDetail || "",
        applicationProcess,
        faqs,
        kbData: knowledgeBase.kbData || null,
        eaScript: knowledgeBase.eaScript || null,
        agentTone: knowledgeBase.agentTone || "warm_professional",
        greetingMessage: knowledgeBase.greetingMessage || "",
      });
    }

    // 3. Insert Negotiation Matrix
    if (negotiationMatrix) {
      await db.insert(negotiationMatrices).values({
        propertyId: insertedProperty.id,
        allowNegotiation: negotiationMatrix.allowNegotiation ?? true,
        targetPrice: String(negotiationMatrix.targetPrice || property.price),
        minFloorPrice: String(negotiationMatrix.minFloorPrice || computeFloorPrice(Number(property.price))),
        maxAllowedDiscountPct: String(negotiationMatrix.maxAllowedDiscountPct || "5.00"),
        concessionRules: negotiationMatrix.concessionRules || [],
        notesForAgent: negotiationMatrix.notesForAgent || "",
      });
    }

    // 4. Insert Media Assets
    if (Array.isArray(property.images) && property.images.length > 0) {
      const mediaRecords = property.images.map((imgUrl: string, idx: number) => ({
        propertyId: insertedProperty.id,
        mediaType: "image",
        url: imgUrl,
        caption: `${property.title} - Photo ${idx + 1}`,
        sortOrder: idx,
      }));

      await db.insert(propertyMedia).values(mediaRecords);
    }

    return NextResponse.json({
      success: true,
      property: insertedProperty,
      qrCodeSvg,
      shareUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create property listing.";
    console.error("Failed to create property listing:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
