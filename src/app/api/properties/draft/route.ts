import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import QRCode from "qrcode";
import { eq, and } from "drizzle-orm";
import { buildDefaultTitle, parseAvailableDate, randomSlugSuffix, slugify } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const userId = session.user.id || null;

    const body = await req.json();
    const { property, draftId } = body || {};

    if (!property) {
      return NextResponse.json({ error: "Property data is required." }, { status: 400 });
    }

    if (!property.title && property.address) {
      property.title = buildDefaultTitle(property.address, property.bedrooms, property.listingType, property.propertyType);
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

    let existingDraft = null;
    if (draftId) {
      const [found] = await db
        .select()
        .from(properties)
        .where(and(eq(properties.id, Number(draftId)), eq(properties.ownerId, userId ?? "")))
        .limit(1);
      existingDraft = found || null;
    }

    let uploadToken = existingDraft?.uploadToken;
    if (!uploadToken) {
      uploadToken = crypto.randomUUID();
    }

    let finalDraftId = existingDraft?.id;

    if (existingDraft) {
      // Update existing draft
      await db
        .update(properties)
        .set({
          title: property.title || existingDraft.title,
          description: property.description || existingDraft.description,
          listingType: property.listingType || existingDraft.listingType,
          propertyType: property.propertyType || existingDraft.propertyType,
          price: property.price ? String(property.price) : existingDraft.price,
          securityDeposit: property.securityDeposit ? String(property.securityDeposit) : existingDraft.securityDeposit,
          minLeaseMonths: property.minLeaseMonths ? Number(property.minLeaseMonths) : existingDraft.minLeaseMonths,
          hoaFeeMonthly: property.hoaFeeMonthly ? String(property.hoaFeeMonthly) : existingDraft.hoaFeeMonthly,
          address: property.address || existingDraft.address,
          unitNumber: property.unitNumber || existingDraft.unitNumber,
          city: property.city || existingDraft.city,
          state: property.state || existingDraft.state,
          zipCode: property.zipCode || existingDraft.zipCode,
          bedrooms: property.bedrooms ? Number(property.bedrooms) : existingDraft.bedrooms,
          bathrooms: property.bathrooms ? String(property.bathrooms) : existingDraft.bathrooms,
          sqft: property.sqft ? Number(property.sqft) : existingDraft.sqft,
          floorNumber: property.floorNumber ?? existingDraft.floorNumber,
          storeys: property.storeys ?? existingDraft.storeys,
          rentScope: property.rentScope || existingDraft.rentScope,
          washrooms: property.washrooms ?? existingDraft.washrooms,
          furnishingStatus: property.furnishingStatus || existingDraft.furnishingStatus,
          availableDate: parseAvailableDate(property.availableDate) ?? existingDraft.availableDate,
          images: Array.isArray(property.images) ? property.images : existingDraft.images,
          coverImageUrl: property.coverImageUrl || existingDraft.coverImageUrl,
          uploadToken,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, existingDraft.id));
    } else {
      // Create new draft
      let slug = property.slug || slugify(property.title || "property-draft");
      const [existingSlug] = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.slug, slug))
        .limit(1);

      if (existingSlug) {
        slug = `${slug}-${randomSlugSuffix()}`;
      }

      const [inserted] = await db
        .insert(properties)
        .values({
          ownerId: userId,
          slug,
          title: property.title || "Untitled Draft Property",
          description: property.description || "",
          listingType: property.listingType || "rent",
          propertyType: property.propertyType,
          status: "draft",
          price: String(property.price || 0),
          securityDeposit: property.securityDeposit ? String(property.securityDeposit) : null,
          minLeaseMonths: property.minLeaseMonths ? Number(property.minLeaseMonths) : null,
          hoaFeeMonthly: property.hoaFeeMonthly ? String(property.hoaFeeMonthly) : "0",
          address: property.address || "Address Pending",
          unitNumber: property.unitNumber || null,
          city: property.city || null,
          state: property.state || null,
          zipCode: property.zipCode || null,
          country: property.country || "India",
          bedrooms: property.bedrooms ? Number(property.bedrooms) : null,
          bathrooms: property.bathrooms ? String(property.bathrooms) : null,
          sqft: property.sqft ? Number(property.sqft) : null,
          floorNumber: property.floorNumber ?? null,
          storeys: property.storeys ?? null,
          rentScope: property.rentScope || null,
          washrooms: property.washrooms ?? null,
          furnishingStatus: property.furnishingStatus || null,
          yearBuilt: property.yearBuilt ? Number(property.yearBuilt) : null,
          availableDate: parseAvailableDate(property.availableDate),
          coverImageUrl: property.coverImageUrl || (Array.isArray(property.images) && property.images[0]) || null,
          images: Array.isArray(property.images) ? property.images : [],
          amenities: property.amenities || [],
          features: property.features || [],
          uploadToken,
          onboardingSource: property.onboardingSource || "conversational_wizard",
          sourceUrl: property.sourceUrl || null,
        })
        .returning({ id: properties.id });

      finalDraftId = inserted.id;
    }

    const uploadUrl = `${protocol}://${host}${BASE_PATH}/properties/upload/${finalDraftId}?token=${uploadToken}`;

    const qrCodeSvg = await QRCode.toString(uploadUrl, {
      type: "svg",
      width: 256,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      draftId: finalDraftId,
      uploadToken,
      uploadUrl,
      qrCodeSvg,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create draft property.";
    console.error("Failed to create or update draft property:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
