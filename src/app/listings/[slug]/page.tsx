import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PublicListingClient } from "@/components/public/PublicListingClient";
import { BASE_PATH, PUBLIC_ORIGIN } from "@/lib/base-path";

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

// One query per request: generateMetadata and the page both read this row.
// Public columns only: the row is serialized into the client component's props,
// so upload_token, owner_id and negotiation_rules are never selected here.
const getPropertyBySlug = cache(async (slug: string) => {
  const [property] = await db
    .select({
      id: properties.id,
      slug: properties.slug,
      status: properties.status,
      title: properties.title,
      description: properties.description,
      address: properties.address,
      unitNumber: properties.unitNumber,
      city: properties.city,
      state: properties.state,
      zipCode: properties.zipCode,
      country: properties.country,
      listingType: properties.listingType,
      propertyType: properties.propertyType,
      price: properties.price,
      securityDeposit: properties.securityDeposit,
      minLeaseMonths: properties.minLeaseMonths,
      hoaFeeMonthly: properties.hoaFeeMonthly,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      sqft: properties.sqft,
      floorNumber: properties.floorNumber,
      storeys: properties.storeys,
      rentScope: properties.rentScope,
      washrooms: properties.washrooms,
      furnishingStatus: properties.furnishingStatus,
      yearBuilt: properties.yearBuilt,
      availableDate: properties.availableDate,
      coverImageUrl: properties.coverImageUrl,
      images: properties.images,
      amenities: properties.amenities,
      features: properties.features,
      qrCodeSvg: properties.qrCodeSvg,
      shareUrl: properties.shareUrl,
      knowledgeBase: properties.knowledgeBase,
    })
    .from(properties)
    .where(eq(properties.slug, slug))
    .limit(1);
  return property ?? null;
});

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const property = await getPropertyBySlug(slug);

    if (!property) {
      return {
        title: "Property Listing | Kyron Realty AI",
      };
    }

    const priceLabel = `₹${Number(property.price).toLocaleString("en-IN")}${
      property.listingType === "rent" ? "/month" : ""
    }`;

    return {
      title: `${property.title} | ${priceLabel} | Kyron Realty AI`,
      description: property.description?.slice(0, 160) || "Explore this verified property listing with 24/7 AI Voice Concierge.",
      openGraph: {
        title: `${property.title} — ${priceLabel}`,
        description: `Explore photos, amenities, and talk with our 24/7 AI Voice Agent for instant answers and tour bookings.`,
        images: property.coverImageUrl ? [{ url: property.coverImageUrl }] : [],
      },
    };
  } catch {
    return {
      title: "Property Listing | Kyron Realty AI",
    };
  }
}

export default async function PublicListingPage({ params }: ListingPageProps) {
  const { slug } = await params;

  // 1. Fetch Property (memoized with generateMetadata for this request)
  const property = await getPropertyBySlug(slug);

  if (!property || property.status === "draft") {
    notFound();
  }

  // 2. Buyer-facing knowledge only. The agent script, tone, greeting, contact
  // email, and internal prompts stay server-side.
  const { knowledgeBase: kb, ...publicProperty } = property;
  const knowledgeBase = {
    synthesizedSalesPitch: kb?.synthesizedSalesPitch ?? null,
    neighborhoodSummary: kb?.neighborhoodSummary ?? null,
    schoolDistrictInfo: kb?.schoolDistrictInfo ?? null,
    petPolicyDetail: kb?.petPolicyDetail ?? null,
    parkingDetail: kb?.parkingDetail ?? null,
    utilitiesDetail: kb?.utilitiesDetail ?? null,
    washroomDetail: kb?.washroomDetail ?? null,
    applicationProcess: kb?.applicationProcess ?? null,
    faqs: kb?.faqs ?? [],
    hyperLocal: kb?.kbData
      ? {
          resolvedLocality: kb.kbData.resolvedLocality ?? null,
          transit: kb.kbData.transit ?? null,
          neighborhood: kb.kbData.neighborhood ?? null,
          nearbyDistances: kb.kbData.nearbyDistances ?? [],
          distancesMeasured: kb.kbData.distancesMeasured ?? false,
        }
      : null,
  };

  // 3. Fetch Media
  const media = await db
    .select()
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, property.id));

  const shareUrl = property.shareUrl || `${PUBLIC_ORIGIN}${BASE_PATH}/listings/${property.slug}`;

  return (
    <PublicListingClient
      property={publicProperty}
      knowledgeBase={knowledgeBase}
      media={media}
      shareUrl={shareUrl}
    />
  );
}
