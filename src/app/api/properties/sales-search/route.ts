import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { and, or, eq, ne, ilike, gte, lte, desc, sql } from "drizzle-orm";
import { refactorSalesSearchQuery } from "@/lib/sales-search-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userSpeech = "", transcriptHistory = [], activeCriteria } = body;

    // 1. Refactor user intent using the second Gemini session with active criteria context
    const criteria = await refactorSalesSearchQuery({
      userSpeech,
      conversationHistory: transcriptHistory,
      activeCriteria,
    });

    // 2. Fetch all available cities across active properties
    const cityRows = await db
      .selectDistinct({ city: properties.city })
      .from(properties)
      .where(ne(properties.status, "draft"));

    const availableCities = Array.from(
      new Set(
        cityRows
          .map((r) => r.city?.trim())
          .filter((c): c is string => Boolean(c))
      )
    ).sort();

    // 3. Mandatory City Gate: If user wants a property but no city is specified, halt and ask for city
    if (criteria.missingCity || !criteria.city) {
      return NextResponse.json({
        success: true,
        missingCity: true,
        promptQuestion: "Which city are you looking in?",
        criteria,
        count: 0,
        properties: [],
        availableCities,
      });
    }

    // 4. City is present: Build PostgreSQL query conditions
    const conditions = [
      ne(properties.status, "draft"),
      ilike(properties.city, `%${criteria.city}%`),
    ];

    if (criteria.listingType) {
      conditions.push(eq(properties.listingType, criteria.listingType));
    }

    if (criteria.bedrooms && criteria.bedrooms > 0) {
      conditions.push(gte(properties.bedrooms, criteria.bedrooms));
    }

    if (criteria.minPrice) {
      conditions.push(gte(properties.price, String(criteria.minPrice)));
    }
    if (criteria.maxPrice) {
      conditions.push(lte(properties.price, String(criteria.maxPrice)));
    }

    // Pet friendly filter (features, amenities, petPolicyDetail, description)
    if (criteria.petFriendly) {
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
        amenities: properties.amenities,
        features: properties.features,
        status: properties.status,
        createdAt: properties.createdAt,
        knowledgeBase: properties.knowledgeBase,
      })
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(10);

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
        status: row.status,
        searchTags: kbData?.searchTags || [],
        transit: kbData?.transit || null,
        neighborhood: kbData?.neighborhood || null,
      };
    });

    return NextResponse.json({
      success: true,
      missingCity: false,
      criteria,
      count: formatted.length,
      properties: formatted,
      availableCities,
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/properties/sales-search:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform sales property search." },
      { status: 500 }
    );
  }
}
