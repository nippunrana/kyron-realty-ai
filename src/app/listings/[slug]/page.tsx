import { notFound } from "next/navigation";
import { Metadata } from "next";
import { db } from "@/db";
import { properties, propertyKnowledgeBases, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PublicListingClient } from "@/components/public/PublicListingClient";
import { BASE_PATH } from "@/lib/base-path";

interface ListingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.slug, slug))
      .limit(1);

    if (!property) {
      return {
        title: "Property Listing | Kyron Realty AI",
      };
    }

    const priceLabel = `$${Number(property.price).toLocaleString()}${
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

  // 1. Fetch Property
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.slug, slug))
    .limit(1);

  if (!property) {
    notFound();
  }

  // 2. Fetch Knowledge Base
  const [knowledgeBase] = await db
    .select()
    .from(propertyKnowledgeBases)
    .where(eq(propertyKnowledgeBases.propertyId, property.id))
    .limit(1);

  // 3. Fetch Media
  const media = await db
    .select()
    .from(propertyMedia)
    .where(eq(propertyMedia.propertyId, property.id));

  const shareUrl = property.shareUrl || `https://egnitech.com${BASE_PATH}/listings/${property.slug}`;

  return (
    <PublicListingClient
      property={property}
      knowledgeBase={knowledgeBase}
      media={media}
      shareUrl={shareUrl}
    />
  );
}
