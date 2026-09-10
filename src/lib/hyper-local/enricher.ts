import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, computeGeminiCost } from "../gemini";
import { researchAreaWithMaps } from "./research";
import { structureResearch, buildKbData } from "./structuring";
import { measurePlaceDistances } from "./distances";
import type { HyperLocalEnrichmentInput, HyperLocalEnrichmentResult, ResearchOutcome } from "./types";

/**
 * Enriches a verified property address with transit and neighbourhood context for the
 * Stage 4.5 owner confirmation card.
 *
 * Three calls, in order:
 *   1. Gemini + Google Maps grounding - names, lines and placeIds. The split from call 2 is
 *      forced: the Maps tool cannot be combined with a JSON response mime type, and prompting
 *      for JSON suppresses the tool call entirely.
 *   2. Gemini JSON structuring - categorises the places and attaches their placeIds.
 *   3. Routes API Compute Route Matrix - the ONLY source of distances, measured against the
 *      categorised placeIds from call 2. Running it after structuring is deliberate: it keeps
 *      junk grounding chunks (address fragments, the property's own building) out of both the
 *      owner's card and the billed element count.
 */
export async function enrichPropertyLocationWithAI(
  input: HyperLocalEnrichmentInput
): Promise<HyperLocalEnrichmentResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Hyper-local enrichment requires a configured Gemini key.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const preferredModel =
    process.env.GEMINI_ENRICHMENT_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  // Deliberately a different model than the primary, so a model-specific outage has somewhere to go.
  const fallbackModel =
    preferredModel === "gemini-3.5-flash-lite" ? "gemini-3.8-flash" : "gemini-3.5-flash-lite";
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
      `[Hyper-Local Enricher] Maps research on ${preferredModel} failed (${primaryErr?.message}). Falling back to ${fallbackModel}...`
    );
    modelUsed = fallbackModel;
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

  // Call 2.
  const structured = await structureResearch(ai, modelUsed, fullLocation, research);

  // Call 3. Null means unmeasured (no key, Routes unreachable, or the origin never geocoded),
  // which is recorded as `distancesMeasured: false` rather than being treated as an error.
  const nearbyDistances = await measurePlaceDistances(fullLocation, structured.targets);

  const latencyMs = Date.now() - startTime;

  const usage = computeGeminiCost(
    modelUsed,
    research.promptTokens + structured.promptTokens,
    research.outputTokens + structured.outputTokens
  );

  const targetCount = structured.targets?.length || 0;
  const routeMatrixCalls = nearbyDistances !== null && targetCount > 0 ? 2 : 0;
  const routeMatrixElements = routeMatrixCalls * targetCount;

  const mapsUsage = {
    groundingQueries: research.queries.length,
    routeMatrixCalls,
    routeMatrixElements,
    freeTierQuota: "70k elements/mo free (India)",
  };

  return {
    kbData: buildKbData(structured.parsed, research, nearbyDistances),
    modelUsed,
    grounded: research.grounded,
    mapsQueryCount: research.queries.length,
    distancesMeasured: nearbyDistances !== null,
    mapsUsage,
    usage,
    latencyMs,
  };
}
