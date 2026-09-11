import { NextRequest, NextResponse } from "next/server";
import { updateAgoraAgentPrompt } from "@/lib/agora-agent-client";
import { buildPropertyAgentContext, getLivePropertyTitle } from "@/lib/property-agent-context";
import { updateSalesJourney } from "@/lib/buyer-brief";
import { emptyJourney, type SalesJourney, type JourneyTurn } from "@/lib/sales-journey";

/**
 * Hands the running sales agent over to one property's knowledge base.
 *
 * The journey update runs first and in the same request as the prompt swap, so the notes on
 * the home the caller just left cannot race the prompt for the home they just opened - one
 * `pathname` change fires both, and two independent calls would land in either order.
 *
 * `slug` may be omitted: that is the caller returning to the search console, where the notes
 * are still worth recording but there is no new prompt to install.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, channelName, slug, previousSlug, turns, journey } = body || {};

    if (!sessionId || !channelName) {
      return NextResponse.json({ error: "sessionId and channelName are required." }, { status: 400 });
    }

    const previousJourney: SalesJourney = journey?.requirements ? journey : emptyJourney();
    // No cap: the browser already sends only the turns since the last update, so trimming
    // here would silently drop the start of a long stretch on one property.
    const newTurns: JourneyTurn[] = Array.isArray(turns) ? turns : [];

    // The title is resolved here rather than trusted from the browser, so a visit note can
    // never be filed against a home the caller was not actually shown.
    const previousTitle =
      typeof previousSlug === "string" && previousSlug ? await getLivePropertyTitle(previousSlug) : null;

    const updatedJourney = await updateSalesJourney({
      turns: newTurns,
      previous: previousJourney,
      previousProperty: previousTitle ? { slug: String(previousSlug), title: previousTitle } : null,
    });

    if (!slug) {
      return NextResponse.json({ success: true, retargeted: false, journey: updatedJourney });
    }

    const context = await buildPropertyAgentContext(String(slug), updatedJourney, "handover");
    if (!context) {
      return NextResponse.json(
        { success: false, error: "No live listing matches that slug.", journey: updatedJourney },
        { status: 404 }
      );
    }

    const swapped = await updateAgoraAgentPrompt(
      String(sessionId),
      String(channelName),
      context.systemPrompt
    );
    if (!swapped) {
      return NextResponse.json(
        { success: false, error: "No active sales session matches that id and channel.", journey: updatedJourney },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      retargeted: true,
      title: context.title,
      verdict: context.fit.verdict,
      journey: updatedJourney,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retarget the voice agent.";
    console.error("Agora retarget session error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
