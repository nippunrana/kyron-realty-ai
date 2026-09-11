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

    const petFriendlyParam = searchParams.get("petFriendly")?.trim()?.toLowerCase();
    const isPetFriendlyFilter = petFriendlyParam === "true" || petFriendlyParam === "1";
    const bedroomsParam = searchParams.get("bedrooms")?.trim();

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

    // Bedrooms filter
    if (bedroomsParam && !isNaN(Number(bedroomsParam)) && Number(bedroomsParam) > 0) {
      conditions.push(gte(properties.bedrooms, Number(bedroomsParam)));
    }

    // Price range
    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(properties.price, minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(properties.price, maxPrice));
    }

    // Pet Friendly filter
    if (isPetFriendlyFilter) {
      conditions.push(
        or(
          sql`${properties.features}::text ILIKE '%pet%'`,
          sql`${properties.amenities}::text ILIKE '%pet%'`,
          and(
            sql`${properties.knowledgeBase}->>'petPolicyDetail' IS NOT NULL`,
            sql`${properties.knowledgeBase}->>'petPolicyDetail' != ''`,
            sql`${properties.knowledgeBase}->>'petPolicyDetail' NOT ILIKE '%no pet%'`,
            sql`${properties.knowledgeBase}->>'petPolicyDetail' NOT ILIKE '%prohibited%'`,
            sql`${properties.knowledgeBase}->>'petPolicyDetail' NOT ILIKE '%not allowed%'`
          ),
          ilike(properties.description, "%pet friendly%"),
          ilike(properties.description, "%pets allowed%")
        )!
      );
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
          sql`(${properties.knowledgeBase}->'kbData')::text ILIKE ${qPattern}`
        )!
      );
    }

    const [rows, cityRows] = await Promise.all([
      db
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
          furnishingStatus: properties.furnishingStatus,
          coverImageUrl: properties.coverImageUrl,
          images: properties.images,
          amenities: properties.amenities,
          features: properties.features,
          status: properties.status,
          createdAt: properties.createdAt,
          knowledgeBase: properties.knowledgeBase,
        })
        .from(properties)
        .where(and(...conditions))
        .orderBy(desc(properties.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .selectDistinct({ city: properties.city })
        .from(properties)
        .where(ne(properties.status, "draft")),
    ]);

    const availableCities = Array.from(
      new Set(
        cityRows
          .map((r) => r.city?.trim())
          .filter((c): c is string => Boolean(c))
      )
    ).sort();

    // Format response items with helper fields
    const formatted = rows.map((row) => {
      const kb = row.knowledgeBase;
      const kbData = kb?.kbData;
      const petDetail = kb?.petPolicyDetail || "";
      const features = (row.features as string[]) || [];
      const amenities = (row.amenities as string[]) || [];
      const isPetFriendly =
        features.some((f) => /pet/i.test(f)) ||
        amenities.some((a) => /pet/i.test(a)) ||
        (petDetail.length > 0 && !/no pet|prohibited|not allowed/i.test(petDetail)) ||
        /pet friendly|pets allowed/i.test(row.description || "");

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
        amenities,
        features,
        petPolicyDetail: petDetail || null,
        isPetFriendly,
        furnishingStatus: row.furnishingStatus || null,
        status: row.status,
        createdAt: row.createdAt,
        searchTags: kbData?.searchTags || [],
        transit: kbData?.transit || null,
        neighborhood: kbData?.neighborhood || null,
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      properties: formatted,
      availableCities,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/properties/search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search properties." },
      { status: 500 }
    );
  }
}
