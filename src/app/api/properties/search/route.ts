import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { and, or, eq, ne, ilike, gte, lte, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim();
    const state = searchParams.get("state")?.trim();
    const listingType = searchParams.get("listingType")?.trim();
    const query = searchParams.get("query")?.trim();
    const minPrice = searchParams.get("minPrice")?.trim();
    const maxPrice = searchParams.get("maxPrice")?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 24), 1), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const conditions = [ne(properties.status, "draft")];

    // City filter
    if (city && city.toLowerCase() !== "all") {
      const cityPattern = `%${city}%`;
      conditions.push(ilike(properties.city, cityPattern));
    }

    // State filter
    if (state && state.toLowerCase() !== "all") {
      const statePattern = `%${state}%`;
      conditions.push(ilike(properties.state, statePattern));
    }

    // Listing type filter (rent vs sale)
    if (listingType && (listingType === "rent" || listingType === "sale")) {
      conditions.push(eq(properties.listingType, listingType));
    }

    // Price range
    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(properties.price, minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(properties.price, maxPrice));
    }

    // General text query (title, address, city, and JSONB knowledgeBase fields)
    if (query) {
      const qPattern = `%${query}%`;
      conditions.push(
        or(
          ilike(properties.title, qPattern),
          ilike(properties.address, qPattern),
          ilike(properties.city, qPattern),
          sql`${properties.knowledgeBase}->>'eaScript' ILIKE ${qPattern}`,
          sql`${properties.knowledgeBase}->>'neighborhoodSummary' ILIKE ${qPattern}`,
          sql`${properties.knowledgeBase}->'kbData'::text ILIKE ${qPattern}`
        )!
      );
    }

    const rows = await db
      .select({
        id: properties.id,
        slug: properties.slug,
        title: properties.title,
        description: properties.description,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        listingType: properties.listingType,
        propertyType: properties.propertyType,
        price: properties.price,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        sqft: properties.sqft,
        coverImageUrl: properties.coverImageUrl,
        images: properties.images,
        status: properties.status,
        createdAt: properties.createdAt,
        knowledgeBase: properties.knowledgeBase,
      })
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response items with helper fields
    const formatted = rows.map((row) => {
      const kb = row.knowledgeBase;
      const kbData = kb?.kbData;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        address: row.address,
        city: row.city || null,
        state: row.state || null,
        listingType: row.listingType,
        propertyType: row.propertyType,
        price: row.price,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        sqft: row.sqft,
        coverImageUrl: row.coverImageUrl,
        images: row.images,
        status: row.status,
        createdAt: row.createdAt,
        eaScript: kb?.eaScript || null,
        searchTags: kbData?.searchTags || [],
        transit: kbData?.transit || null,
        neighborhood: kbData?.neighborhood || null,
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      properties: formatted,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to search properties.";
    console.error("Error in GET /api/properties/search:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
