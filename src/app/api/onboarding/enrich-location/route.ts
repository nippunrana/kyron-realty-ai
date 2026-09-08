import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { enrichPropertyLocationWithAI } from "@/lib/hyper-local-enricher";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const {
      address,
      city,
      state,
      price,
      listingType,
      bedrooms,
      bathrooms,
      sqft,
      propertyType,
    } = body || {};

    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return NextResponse.json(
        { error: "A valid verified property address is required for hyper-local enrichment." },
        { status: 400 }
      );
    }

    const result = await enrichPropertyLocationWithAI({
      address: address.trim(),
      city: city?.trim(),
      state: state?.trim(),
      price: price ? Number(price) : undefined,
      listingType: listingType || "rent",
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      sqft: sqft ? Number(sqft) : undefined,
      propertyType: propertyType || "apartment",
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[Hyper-Local Enrichment Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Hyper-local enrichment failed." },
      { status: 500 }
    );
  }
}
