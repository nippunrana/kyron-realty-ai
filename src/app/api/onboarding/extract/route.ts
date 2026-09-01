import { NextRequest, NextResponse } from "next/server";
import { extractPropertyKnowledgeBase } from "@/lib/kb-extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markdown, conversationText, url, existingImages } = body || {};

    if (!markdown && !conversationText && !url) {
      return NextResponse.json(
        { error: "At least one input source (markdown, conversationText, or url) is required." },
        { status: 400 }
      );
    }

    const extraction = await extractPropertyKnowledgeBase({
      markdown,
      conversationText,
      url,
      existingImages,
    });

    return NextResponse.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    console.error("Knowledge extraction route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract property knowledge base.",
      },
      { status: 500 }
    );
  }
}
