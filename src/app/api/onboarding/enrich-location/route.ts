import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { enrichPropertyLocationWithAI } from "@/lib/hyper-local";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { address, city, state } = body || {};

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
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[Hyper-Local Enrichment Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Hyper-local enrichment failed." },
      { status: 500 }
    );
  }
}
