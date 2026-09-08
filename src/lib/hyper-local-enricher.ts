import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, computeGeminiCost, type GeminiUsage } from "./gemini";
import type { HyperLocalKbData } from "@/db/schema";

export interface HyperLocalEnrichmentInput {
  address: string;
  city?: string;
  state?: string;
  price?: number;
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyType?: string;
}

export interface HyperLocalEnrichmentResult {
  kbData: HyperLocalKbData;
  /**
   * Retained so the studio and publish payload keep compiling. The buyer agent's script is
   * no longer compiled here: onboarding researches the area, it does not author Sarah's prompt.
   * An empty value makes `agora-agent-client` assemble the prompt from the knowledge base row.
   */
  eaScript: string;
  modelUsed: string;
  /** False when the Maps tool did not fire, i.e. the content is unverified model recall. */
  grounded: boolean;
  mapsQueryCount: number;
  usage?: GeminiUsage;
  latencyMs: number;
}

interface ResearchOutcome {
  text: string;
  grounded: boolean;
  queries: string[];
  sources: NonNullable<HyperLocalKbData["sources"]>;
  promptTokens: number;
  outputTokens: number;
}

/**
 * Call 1 - grounded research against Google Maps.
 *
 * Deliberately contains no JSON or schema wording: asking this call for structured output
 * makes the model answer from memory without ever invoking the tool, and the Maps tool is
 * additionally rejected outright alongside `responseMimeType: "application/json"`.
 */
async function researchAreaWithMaps(
  ai: GoogleGenAI,
  model: string,
  fullLocation: string
): Promise<ResearchOutcome> {
  const prompt = `
Use Google Maps to research the area around this address: ${fullLocation}

Look up and report, using only real places that Google Maps returns:

- The locality, sector or neighbourhood this address resolves to.
- The nearest metro station, suburban rail station or major bus interchange:
  its name, the line it is on, and roughly how far it is from the address.
- The major highways, expressways or arterial roads that serve this location.
- Well-known schools near this address.
- Major hospitals near this address.

Report what Maps actually returns. Where Maps has no result for something, say so
plainly rather than filling it in from memory. Do not describe the specific
building at this address, its condition, its price, or its policies - you are
reporting on the area only.

Search once per category listed above and report from those results. Do not run
extra lookups on individual place names you notice inside reviews, addresses or
descriptions.
`.trim();

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleMaps: {} }] },
  });

  const grounding = res.candidates?.[0]?.groundingMetadata;
  const sources = (grounding?.groundingChunks || [])
    .filter((chunk) => chunk.maps)
    .map((chunk) => ({
      // Individual reviews arrive as their own chunks titled "Review of <place>"; both the
      // suffix and that prefix are display noise once the place is the unit of attribution.
      title: (chunk.maps?.title || "")
        .replace(/ - Google Maps$/, "")
        .replace(/^Review of /, ""),
      uri: chunk.maps?.uri || "",
      placeId: chunk.maps?.placeId || undefined,
    }))
    .filter((source) => source.title && source.uri);

  // One place backs several claims and several reviews; key on placeId so it appears once.
  const deduped = Array.from(new Map(sources.map((s) => [s.placeId || s.uri, s])).values());

  return {
    text: res.text || "",
    grounded: Boolean(grounding),
    queries: grounding?.webSearchQueries || [],
    sources: deduped,
    promptTokens: res.usageMetadata?.promptTokenCount || 0,
    // Thinking tokens bill as output.
    outputTokens:
      (res.usageMetadata?.candidatesTokenCount || 0) + (res.usageMetadata?.thoughtsTokenCount || 0),
  };
}

/**
 * Enriches a verified property address with transit and neighbourhood context for the
 * Stage 4.5 owner confirmation card.
 *
 * Two calls: Google Maps grounded research, then a structuring pass. The split is forced -
 * the Maps tool cannot be combined with a JSON response mime type, and prompting for JSON
 * suppresses the tool call entirely.
 */
export async function enrichPropertyLocationWithAI(
  input: HyperLocalEnrichmentInput
): Promise<HyperLocalEnrichmentResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Hyper-local enrichment requires a configured Gemini key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const preferredModel = process.env.GEMINI_ENRICHMENT_MODEL || process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const startTime = Date.now();

  const fullLocation = [input.address, input.city, input.state, "India"].filter(Boolean).join(", ");

  // Call 1. A failed crawl must not take the onboarding call down with it: the structuring
  // pass still runs, and `grounded: false` marks the result as unverified recall.
  let research: ResearchOutcome = {
    text: "",
    grounded: false,
    queries: [],
    sources: [],
    promptTokens: 0,
    outputTokens: 0,
  };
  let modelUsed = preferredModel;

  try {
    research = await researchAreaWithMaps(ai, preferredModel, fullLocation);
  } catch (primaryErr: any) {
    console.warn(
      `[Hyper-Local Enricher] Maps research on ${preferredModel} failed (${primaryErr?.message}). Falling back to gemini-3.5-flash-lite...`
    );
    modelUsed = "gemini-3.5-flash-lite";
    try {
      research = await researchAreaWithMaps(ai, modelUsed, fullLocation);
    } catch (fallbackErr: any) {
      console.warn(
        `[Hyper-Local Enricher] Maps research unavailable (${fallbackErr?.message}). Structuring without verified research.`
      );
    }
  }

  if (!research.grounded) {
    console.warn(
      "[Hyper-Local Enricher] Google Maps grounding did not fire; the result is unverified model recall."
    );
  }

  // Call 2. Structure the research. No tools here, so JSON mode is available.
  const structuringPrompt = `
You are a Location Intelligence Analyst for Kyron Realty AI.

A property owner is onboarding a listing by voice. Below is verified Google Maps
research for their address. Your job is to turn it into the structured record we
show that owner on screen for confirmation.

PROPERTY INPUT:
- Location / Address: ${fullLocation}

VERIFIED GOOGLE MAPS RESEARCH:
${research.text || "(No verified research was returned. Leave every field you cannot support empty.)"}

RULES:
- Use ONLY the research above. Do not add a station, school, hospital, mall or
  road that does not appear in it, and do not enrich it from your own knowledge.
- If the research does not cover something, return "" for that text field and []
  for that list. An omitted field is correct behaviour, not a failure.
- Keep distances only where the research gives them. Never invent a number.
- Say nothing about the specific building, its price, or its policies.
- Prefer 2-4 high-confidence entries per list over a longer speculative one.

TASK:
0. resolvedLocality: the locality/sector the research resolves this address to.
   locationConfidence: "high" if the research is specific to this sub-locality,
   "medium" if it covers the city but not the sector, "low" if it is thin.
1. transit: nearest station (name, line, approximate distance if the research
   gives one) and the major highways or arterial roads serving this location.
2. neighborhood: schools and hospitals.
3. needsOwnerVerification: the field names the research covered least well, so
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
  "needsOwnerVerification": string[]
}
`.trim();

  const structuringRes = await ai.models.generateContent({
    model: modelUsed,
    contents: structuringPrompt,
    config: { responseMimeType: "application/json" },
  });

  const responseText = structuringRes.text || "";
  if (!responseText.trim()) {
    throw new Error("Gemini hyper-local enrichment returned an empty response.");
  }

  const parsed = JSON.parse(responseText);
  const latencyMs = Date.now() - startTime;

  const usage = computeGeminiCost(
    modelUsed,
    research.promptTokens + (structuringRes.usageMetadata?.promptTokenCount || 0),
    research.outputTokens +
      (structuringRes.usageMetadata?.candidatesTokenCount || 0) +
      (structuringRes.usageMetadata?.thoughtsTokenCount || 0)
  );

  const kbData: HyperLocalKbData = {
    resolvedLocality: parsed.resolvedLocality || "",
    locationConfidence: parsed.locationConfidence || undefined,
    needsOwnerVerification: Array.isArray(parsed.needsOwnerVerification)
      ? parsed.needsOwnerVerification
      : [],
    grounded: research.grounded,
    sources: research.sources,
    transit: parsed.transit || {},
    neighborhood: parsed.neighborhood || {},
  };

  return {
    kbData,
    eaScript: "",
    modelUsed,
    grounded: research.grounded,
    mapsQueryCount: research.queries.length,
    usage,
    latencyMs,
  };
}
