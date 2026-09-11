/**
 * The caller's running memory across one sales call, kept as two threads.
 *
 * `requirements` is a STRUCTURED merge, never a re-summarised paragraph: re-summarising prose
 * on every property visit is lossy, and by the fourth home "under 50,000" has quietly decayed
 * into "budget-conscious" - which is exactly the number the fit check needs to be exact about.
 * `visits` is appended to, one entry per home, so nothing already recorded can degrade either.
 * Only the free-text notes are model-generated, and only ever for the turns since last time.
 */
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./gemini";
import type { BuyerRequirements } from "./property-fit";
import type { JourneyTurn, SalesJourney } from "./sales-journey";

export interface JourneyUpdateInput {
  /** Only the turns since the journey was last updated. */
  turns: JourneyTurn[];
  previous: SalesJourney;
  /** The home the caller was looking at during these turns, when they were on one. */
  previousProperty?: { slug: string; title: string } | null;
}

/** Later value wins when it was actually stated; otherwise the earlier one stands. */
function coalesce<T>(next: T | null | undefined, prev: T | null): T | null {
  return next === null || next === undefined ? prev : next;
}

function mergeList(next: string[] | undefined, prev: string[]): string[] {
  const seen = new Set(prev.map((s) => s.toLowerCase()));
  const merged = [...prev];
  for (const item of next || []) {
    const clean = item.trim();
    if (clean && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      merged.push(clean);
    }
  }
  return merged.slice(0, 8);
}

const CITIES =
  /\b(faridabad|delhi|gurugram|gurgaon|noida|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata)\b/i;

/**
 * Keeps the call usable when Gemini is unreachable. Deliberately conservative: it only fills
 * a field the caller stated in plain terms, because a wrong requirement produces a wrong fit
 * verdict, and a missing one merely produces a question Sarah asks anyway.
 */
function fallbackRequirements(text: string, prev: BuyerRequirements): BuyerRequirements {
  const cityMatch = text.match(CITIES);
  const bedMatch = text.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  const budgetMatch = text.match(/(?:under|below|upto|up to|maximum|max|budget(?:\s+of)?|around)\s*(?:rs\.?|₹|inr)?\s*([\d,]+)\s*(k|lakh|lakhs|l)?/i);

  let budgetMax = prev.budgetMax;
  if (budgetMatch) {
    const raw = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    const unit = (budgetMatch[2] || "").toLowerCase();
    if (!isNaN(raw) && raw > 0) {
      const scaled = unit === "k" ? raw * 1_000 : unit.startsWith("l") ? raw * 100_000 : raw;
      // "under 50" with no unit is a mishearing, not a ₹50 ceiling. Leaving it unset makes
      // Sarah ask again; accepting it would hand the fit check a hard miss on every home.
      if (scaled >= 1000) budgetMax = scaled;
    }
  }

  const wantsPets = /\b(pet|pets|dog|dogs|cat|cats)\b/i.test(text);
  const rejectsPets = /\b(no pets?|don'?t have (a )?pets?|without (a )?pets?)\b/i.test(text);

  return {
    city: cityMatch ? cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase() : prev.city,
    budgetMax,
    bedrooms: bedMatch ? parseInt(bedMatch[1], 10) : prev.bedrooms,
    petsNeeded: rejectsPets ? false : wantsPets ? true : prev.petsNeeded,
    listingType: /\b(rent|lease|rental)\b/i.test(text)
      ? "rent"
      : /\b(buy|purchase|sale)\b/i.test(text)
        ? "sale"
        : prev.listingType,
    moveInTimeline: prev.moveInTimeline,
    mustHaves: prev.mustHaves,
    dealBreakers: prev.dealBreakers,
  };
}

const SCHEMA = {
  type: "object",
  properties: {
    city: { type: "string", nullable: true },
    budgetMax: { type: "number", nullable: true },
    bedrooms: { type: "number", nullable: true },
    petsNeeded: { type: "boolean", nullable: true },
    listingType: { type: "string", enum: ["rent", "sale"], nullable: true },
    moveInTimeline: { type: "string", nullable: true },
    mustHaves: { type: "array", items: { type: "string" } },
    dealBreakers: { type: "array", items: { type: "string" } },
    searchSummary: { type: "string" },
    visitNotes: { type: "string", nullable: true },
  },
  required: ["searchSummary"],
} as const;

/**
 * Folds the newest turns into the journey: structured requirements merge, the search thread
 * is rewritten from its own previous value plus what is new, and a home the caller was
 * looking at gains one entry of its own.
 */
export async function updateSalesJourney(input: JourneyUpdateInput): Promise<SalesJourney> {
  const { turns, previous, previousProperty } = input;
  const transcriptText = turns
    .filter((t) => t.role !== "system" && t.text.trim() && !t.text.trim().startsWith("["))
    .map((t) => `${t.role === "user" ? "CALLER" : "SARAH"}: ${t.text.trim()}`)
    .join("\n");

  if (!transcriptText) return previous;

  const callerText = turns
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" ");
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      ...previous,
      requirements: fallbackRequirements(callerText, previous.requirements),
    };
  }

  const prompt = `
You maintain the running memory of a live real-estate sales call for Kyron Realty AI.
Read the new conversation turns and update what we know about the CALLER.

WHAT WE ALREADY RECORDED:
- Looking in: ${previous.requirements.city || "unknown"}
- Wants to: ${previous.requirements.listingType || "unknown"}
- Bedrooms: ${previous.requirements.bedrooms ?? "unknown"}
- Budget ceiling: ${previous.requirements.budgetMax ?? "unknown"}
- Has a pet: ${previous.requirements.petsNeeded ?? "unknown"}
- Move-in timing: ${previous.requirements.moveInTimeline || "unknown"}
- Asked for: ${previous.requirements.mustHaves.join(", ") || "nothing recorded"}
- Will not accept: ${previous.requirements.dealBreakers.join(", ") || "nothing recorded"}

THEIR SEARCH STORY SO FAR:
${previous.searchSummary || "Nothing recorded yet."}

RULES:
1. Return a field ONLY if the caller actually stated it. If the new turns do not mention it, return null and we will keep what we already had. Never carry a value over yourself, and never infer one from the homes they were shown.
2. budgetMax is a number in rupees. "50k" is 50000, "1.2 lakh" is 120000. Monthly figures for rentals, total price for sales.
3. mustHaves are things they asked for (for example "parking", "near a metro", "furnished"). dealBreakers are things they refused outright. Short phrases only, and only ones they said.
4. searchSummary: rewrite THEIR SEARCH STORY SO FAR into one or two sentences that also cover what is new - what they are looking for and why. Keep every specific number that appears in the old version unless the caller changed it.
${previousProperty ? `5. visitNotes: one or two sentences on how the caller reacted to "${previousProperty.title}" specifically - what they liked, disliked, asked about, or objected to. Return null if they did not react to it.` : `5. visitNotes: return null.`}

NEW CONVERSATION TURNS:
${transcriptText}
`.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: SCHEMA as any,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const prev = previous.requirements;

    const requirements: BuyerRequirements = {
      city: typeof parsed.city === "string" && parsed.city.trim() ? parsed.city.trim() : prev.city,
      budgetMax: typeof parsed.budgetMax === "number" && parsed.budgetMax > 0 ? parsed.budgetMax : prev.budgetMax,
      bedrooms: typeof parsed.bedrooms === "number" && parsed.bedrooms > 0 ? parsed.bedrooms : prev.bedrooms,
      petsNeeded: coalesce(typeof parsed.petsNeeded === "boolean" ? parsed.petsNeeded : null, prev.petsNeeded),
      listingType: parsed.listingType === "rent" || parsed.listingType === "sale" ? parsed.listingType : prev.listingType,
      moveInTimeline:
        typeof parsed.moveInTimeline === "string" && parsed.moveInTimeline.trim()
          ? parsed.moveInTimeline.trim()
          : prev.moveInTimeline,
      mustHaves: mergeList(parsed.mustHaves, prev.mustHaves),
      dealBreakers: mergeList(parsed.dealBreakers, prev.dealBreakers),
    };

    const visits = [...previous.visits];
    const notes = typeof parsed.visitNotes === "string" ? parsed.visitNotes.trim() : "";
    if (previousProperty && notes) {
      const entry = { slug: previousProperty.slug, title: previousProperty.title, notes };
      const existing = visits.findIndex((v) => v.slug === previousProperty.slug);
      if (existing >= 0) visits[existing] = entry;
      else visits.push(entry);
    }

    return {
      requirements,
      searchSummary:
        typeof parsed.searchSummary === "string" && parsed.searchSummary.trim()
          ? parsed.searchSummary.trim()
          : previous.searchSummary,
      // Keeps the prompt bounded on a long call; the requirements thread carries the facts.
      visits: visits.slice(-5),
    };
  } catch (err) {
    console.warn("[BuyerBrief] Gemini journey update fell back to regex extraction:", err);
    return {
      ...previous,
      requirements: fallbackRequirements(callerText, previous.requirements),
    };
  }
}
