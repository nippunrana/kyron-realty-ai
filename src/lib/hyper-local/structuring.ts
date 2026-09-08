import { GoogleGenAI } from "@google/genai";
import type { HyperLocalKbData } from "@/db/schema";
import type { MapsSource, ResearchOutcome } from "./types";
import type { DistanceTarget } from "./distances";

export interface StructuredResearch {
  parsed: any;
  /** Places that survived placeId validation, ready for distance measurement. */
  targets: DistanceTarget[];
  promptTokens: number;
  outputTokens: number;
}

/**
 * Call 2 - structure the research into the record shown to the owner.
 *
 * No tools here, so JSON mode is available. The model is additionally asked to attach the
 * Maps placeId to each named place, which is what makes distance measurement possible: the
 * grounding chunks carry placeIds but not which category the place belongs to.
 */
export async function structureResearch(
  ai: GoogleGenAI,
  model: string,
  fullLocation: string,
  research: ResearchOutcome
): Promise<StructuredResearch> {
  // The model may only choose from places Maps actually returned; anything else is invented.
  const sourceList = research.sources
    .filter((s) => s.placeId)
    .map((s) => `- ${s.title} [placeId: ${s.placeId}]`)
    .join("\n");

  const prompt = `
You are a Location Intelligence Analyst for Kyron Realty AI.

A property owner is onboarding a listing by voice. Below is verified Google Maps
research for their address. Your job is to turn it into the structured record we
show that owner on screen for confirmation.

PROPERTY INPUT:
- Location / Address: ${fullLocation}

VERIFIED GOOGLE MAPS RESEARCH:
${research.text || "(No verified research was returned. Leave every field you cannot support empty.)"}

GOOGLE MAPS PLACES AVAILABLE (name and placeId):
${sourceList || "(No place records were returned.)"}

RULES:
- Use ONLY the research above. Do not add a station, school, hospital, mall or
  road that does not appear in it, and do not enrich it from your own knowledge.
- If the research does not cover something, return "" for that text field and []
  for that list. An omitted field is correct behaviour, not a failure.
- Never state a distance, a travel time, or how walkable something is, in any
  field. Distances are measured separately by a routing service. A name alone is
  the correct and complete answer here.
- Say nothing about the specific building, its price, or its policies.
- Prefer 2-4 high-confidence entries per list over a longer speculative one.

TASK:
0. resolvedLocality: the locality/sector the research resolves this address to.
   locationConfidence: "high" if the research is specific to this sub-locality,
   "medium" if it covers the city but not the sector, "low" if it is thin.
1. transit: nearest station (name and line only) and the major highways or
   arterial roads serving this location.
2. neighborhood: schools and hospitals.
3. places: for every station, school and hospital you named above, one entry
   copying its placeId EXACTLY from the list of available places. Use only
   placeIds from that list; omit any place whose placeId is not listed. Do not
   include highways or roads here.
4. needsOwnerVerification: the field names the research covered least well, so
   the owner can be asked to confirm those specifically. [] if all were solid.

OUTPUT FORMAT:
Return strictly valid JSON matching this schema. Use "" and [] for anything the
research does not support.
{
  "resolvedLocality": string,
  "locationConfidence": "high" | "medium" | "low",
  "transit": {
    "nearestMetro": string,
    "majorHighways": string[]
  },
  "neighborhood": {
    "topSchools": string[],
    "topHospitals": string[]
  },
  "places": [
    { "name": string, "placeId": string, "category": "transit" | "school" | "hospital" }
  ],
  "needsOwnerVerification": string[]
}
`.trim();

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const responseText = res.text || "";
  if (!responseText.trim()) {
    throw new Error("Gemini hyper-local enrichment returned an empty response.");
  }

  const parsed = JSON.parse(responseText);

  return {
    parsed,
    targets: selectDistanceTargets(parsed.places, research.sources),
    promptTokens: res.usageMetadata?.promptTokenCount || 0,
    outputTokens:
      (res.usageMetadata?.candidatesTokenCount || 0) + (res.usageMetadata?.thoughtsTokenCount || 0),
  };
}

const VALID_CATEGORIES = new Set(["transit", "school", "hospital"]);

/**
 * Keeps only places whose placeId genuinely came back from Maps grounding.
 *
 * The model is capable of inventing a plausible-looking placeId, and a fabricated one either
 * errors or - worse - resolves to a real but unrelated place, attaching a confident distance
 * to the wrong building. Validating against the source set is what makes that impossible.
 */
export function selectDistanceTargets(
  places: unknown,
  sources: MapsSource[]
): DistanceTarget[] {
  if (!Array.isArray(places)) return [];
  const known = new Set(sources.map((s) => s.placeId).filter(Boolean) as string[]);
  const seen = new Set<string>();

  return places.flatMap((place: any) => {
    const placeId = typeof place?.placeId === "string" ? place.placeId.trim() : "";
    const name = typeof place?.name === "string" ? place.name.trim() : "";
    const category = place?.category;
    if (!placeId || !name || !known.has(placeId) || !VALID_CATEGORIES.has(category)) return [];
    if (seen.has(placeId)) return [];
    seen.add(placeId);
    return [{ placeId, name, category } as DistanceTarget];
  });
}

/** Builds the persisted record, leaving the string lists as the authority on names. */
export function buildKbData(
  parsed: any,
  research: ResearchOutcome,
  nearbyDistances: HyperLocalKbData["nearbyDistances"] | null
): HyperLocalKbData {
  return {
    resolvedLocality: parsed.resolvedLocality || "",
    locationConfidence: parsed.locationConfidence || undefined,
    needsOwnerVerification: Array.isArray(parsed.needsOwnerVerification)
      ? parsed.needsOwnerVerification
      : [],
    grounded: research.grounded,
    sources: research.sources,
    distancesMeasured: nearbyDistances !== null,
    ...(nearbyDistances ? { nearbyDistances } : {}),
    transit: parsed.transit || {},
    neighborhood: parsed.neighborhood || {},
  };
}
