import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { scrapePropertyUrl } from "@/lib/apify-crawler";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL string is required." },
        { status: 400 }
      );
    }

    const scraped = await scrapePropertyUrl(url);

    return NextResponse.json({
      success: true,
      data: scraped,
    });
  } catch (error: any) {
    console.error("Scraping route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to scrape property URL.",
      },
      { status: 500 }
    );
  }
}
