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
  eaScript: string;
  modelUsed: string;
  usage?: GeminiUsage;
  latencyMs: number;
}

/**
 * Enriches verified property address with hyper-local transit, neighborhood context,
 * common buyer objections & playbook, search tags, and a pre-compiled turnkey EA voice script.
 * Runs on Gemini 3.8 Flash with automatic fallback to Gemini 3.5 Flash Lite if throttled.
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

  const fullLocation = [
    input.address,
    input.city,
    input.state,
    "India",
  ]
    .filter(Boolean)
    .join(", ");

  const isRental = input.listingType === "rent";
  const priceFormatted = input.price && input.price > 0
    ? `₹${Number(input.price).toLocaleString("en-IN")}${isRental ? "/month" : ""}`
    : "Price upon inquiry";

  const prompt = `
You are the Principal Real Estate Location Analyst & Voice AI Architect for Kyron Realty AI.
Analyze the following verified property details and synthesize rich hyper-local transit, neighborhood context, predictive buyer objection handling, and a turnkey Agora real-time voice agent prompt.

PROPERTY INPUT:
- Location / Address: ${fullLocation}
- Listing Type: ${input.listingType ? (isRental ? "Rental" : "For Sale") : "Rental"}
- Asking Price: ${priceFormatted}
- Configuration: ${input.bedrooms ? `${input.bedrooms} BHK` : "Residential unit"}, ${input.bathrooms ? `${input.bathrooms} Baths` : ""}, ${input.sqft ? `${input.sqft} sqft` : ""}
- Property Type: ${input.propertyType || "Apartment"}

TASK REQUIREMENTS:
1. TRANSIT & CONNECTIVITY:
   - Identify the most accurate nearest metro station (station name, metro line, and realistic commute time/distance).
   - List key highways, expressways, or arterial access corridors connecting this location.
   - Summarize daily commute connectivity to major business hubs (e.g. South Delhi, Cyber City/Gurugram, Noida, or local commercial centers).

2. NEIGHBORHOOD LIVABILITY & AMENITIES:
   - Prominent landmarks, shopping malls, or commercial centers nearby.
   - Top recognized schools within easy reach.
   - Leading multi-speciality hospitals nearby.
   - Residential vibe, green cover, and livability characteristics of this sector/neighborhood.

3. PREDICTIVE BUYER / TENANT OBJECTIONS PLAYBOOK:
   - Predict 3 to 5 realistic questions or objections prospective callers will raise (e.g. rental price justification, last-mile metro transit, bachelor/family preference, utility/maintenance charges, security deposit).
   - For each, provide a natural, spoken 1-2 sentence response crafted specifically for the voice sales agent ('Sarah') to sound articulate, warm, and highly professional over phone audio.

4. SEARCH INDEXING TAGS:
   - Provide 6 to 10 high-intent search tags combining city, sector, transit, and property type (e.g. "${input.city || "Faridabad"} Rental", "${input.address}", "Metro Connectivity", "${input.bedrooms ? `${input.bedrooms} BHK` : "Spacious Living"}").

5. PRE-COMPILED ESTATE AGENT (EA) VOICE SCRIPT:
   - Generate a complete, ready-to-run system prompt for the AI agent 'Sarah' representing this property.
   - Include:
     * Agent Identity & Professional Warm Persona
     * Core Verified Property Overview (${fullLocation}, ${priceFormatted}, specs)
     * Verified Neighborhood & Transit Knowledge (seamlessly woven into conversation guidance)
     * Objection Handling Guidelines (using exchange-of-value principles)
     * Proactive viewing appointment booking call-to-action
     * Strict Zero-Hallucination Policy: Never fabricate unverified specs or discounts.

OUTPUT FORMAT:
Return strictly valid JSON matching this schema:
{
  "transit": {
    "nearestMetro": string,
    "majorHighways": string[],
    "commuteConnectivity": string
  },
  "neighborhood": {
    "landmarks": string[],
    "topSchools": string[],
    "topHospitals": string[],
    "vibeAndLivability": string
  },
  "buyerObjectionsAndPlaybook": [
    {
      "topic": string,
      "likelyQuestion": string,
      "voiceAgentRecommendedAnswer": string
    }
  ],
  "searchTags": string[],
  "eaScript": string
}
`.trim();

  let responseText = "";
  let modelUsed = preferredModel;
  let usage: GeminiUsage | undefined;

  try {
    const res = await ai.models.generateContent({
      model: preferredModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const promptTokens = res.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = res.usageMetadata?.candidatesTokenCount || 0;
    usage = computeGeminiCost(preferredModel, promptTokens, candidateTokens);
    responseText = res.text || "";
  } catch (primaryErr: any) {
    console.warn(`[Hyper-Local Enricher] Primary model ${preferredModel} failed (${primaryErr.message}). Attempting fallback to gemini-3.5-flash-lite...`);
    const fallbackModel = "gemini-3.5-flash-lite";
    modelUsed = fallbackModel;

    const fallbackRes = await ai.models.generateContent({
      model: fallbackModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const promptTokens = fallbackRes.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = fallbackRes.usageMetadata?.candidatesTokenCount || 0;
    usage = computeGeminiCost(fallbackModel, promptTokens, candidateTokens);
    responseText = fallbackRes.text || "";
  }

  if (!responseText.trim()) {
    throw new Error("Gemini hyper-local enrichment returned an empty response.");
  }

  const parsed = JSON.parse(responseText);
  const latencyMs = Date.now() - startTime;

  const kbData: HyperLocalKbData = {
    transit: parsed.transit || {},
    neighborhood: parsed.neighborhood || {},
    buyerObjectionsAndPlaybook: Array.isArray(parsed.buyerObjectionsAndPlaybook)
      ? parsed.buyerObjectionsAndPlaybook
      : [],
    searchTags: Array.isArray(parsed.searchTags) ? parsed.searchTags : [],
  };

  return {
    kbData,
    eaScript: parsed.eaScript || "",
    modelUsed,
    usage,
    latencyMs,
  };
}
