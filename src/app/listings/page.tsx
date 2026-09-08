import { Metadata } from "next";
import { db } from "@/db";
import { properties, propertyKnowledgeBases } from "@/db/schema";
import { ne, desc, eq, sql } from "drizzle-orm";
import {
  ListingsDiscoveryClient,
  type DiscoveryPropertyItem,
} from "@/components/public/ListingsDiscoveryClient";

export const metadata: Metadata = {
  title: "Explore Properties | Kyron Realty AI",
  description:
    "Discover verified real estate listings with 24/7 AI Voice Concierges powered by Agora real-time speech intelligence.",
};

export default async function ListingsPage() {
  let initialProperties: DiscoveryPropertyItem[] = [];
  const citiesSet = new Set<string>();

  try {
    const rows = await db
      .select({
        id: properties.id,
        slug: properties.slug,
        title: properties.title,
        description: properties.description,
        address: properties.address,
        city: sql<string>`coalesce(${propertyKnowledgeBases.city}, ${properties.city})`,
        state: sql<string>`coalesce(${propertyKnowledgeBases.state}, ${properties.state})`,
        listingType: properties.listingType,
        propertyType: properties.propertyType,
        price: properties.price,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        sqft: properties.sqft,
        coverImageUrl: properties.coverImageUrl,
        images: properties.images,
        status: properties.status,
        kbData: propertyKnowledgeBases.kbData,
      })
      .from(properties)
      .leftJoin(
        propertyKnowledgeBases,
        eq(properties.id, propertyKnowledgeBases.propertyId)
      )
      .where(ne(properties.status, "draft"))
      .orderBy(desc(properties.createdAt))
      .limit(30);

    initialProperties = rows.map((r) => {
      if (r.city && r.city.trim()) {
        citiesSet.add(r.city.trim());
      }
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        address: r.address,
        city: r.city || null,
        state: r.state || null,
        listingType: r.listingType,
        propertyType: r.propertyType,
        price: r.price,
        bedrooms: r.bedrooms,
        bathrooms: r.bathrooms,
        sqft: r.sqft,
        coverImageUrl: r.coverImageUrl,
        images: r.images,
        status: r.status,
        searchTags: r.kbData?.searchTags || [],
        transit: r.kbData?.transit || null,
        neighborhood: r.kbData?.neighborhood || null,
      };
    });
  } catch (err) {
    console.error("Error fetching listings for discovery page:", err);
  }

  const availableCities = Array.from(citiesSet).sort();

  return (
    <ListingsDiscoveryClient
      initialProperties={initialProperties}
      availableCities={availableCities}
    />
  );
}
