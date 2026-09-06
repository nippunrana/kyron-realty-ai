import { GoogleGenAI } from "@google/genai";
import {
  buildDefaultTitle,
  computeFloorPrice,
  ListingType,
  randomSlugSuffix,
  slugify,
} from "./listing-helpers";
import { getGeminiApiKey, computeGeminiCost, type GeminiUsage } from "./gemini";

export interface ExtractedPropertyPayload {
  property: {
    title: string;
    slug: string;
    description: string;
    listingType: ListingType;
    propertyType: "apartment" | "single_family" | "condo" | "townhouse" | "commercial";
    price: number;
    securityDeposit: number;
    minLeaseMonths: number;
    hoaFeeMonthly: number;
    address: string;
    unitNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    availableDate?: string;
    amenities: string[];
    features: string[];
    coverImageUrl?: string;
    images: string[];
  };
  knowledgeBase: {
    rawScrapedMarkdown: string;
    synthesizedSalesPitch: string;
    neighborhoodSummary: string;
    schoolDistrictInfo: string;
    petPolicyDetail: string;
    parkingDetail: string;
    utilitiesDetail: string;
    applicationProcess: string;
    contactEmail?: string;
    pillLabels?: {
      parking?: string;
      pets?: string;
      utilities?: string;
      availableDate?: string;
      hoa?: string;
    };
    faqs: Array<{ question: string; answer: string; category: string }>;
    agentTone: string;
    greetingMessage: string;
    unknownFallbackPolicy?: string;
  };
  negotiationMatrix: {
    allowNegotiation: boolean;
    targetPrice: number;
    minFloorPrice: number;
    maxAllowedDiscountPct: number;
    concessionRules: Array<{
      condition: string;
      concession: string;
      maxConcessionValue: number;
      requiresApproval: boolean;
    }>;
    notesForAgent: string;
  };
  usage?: GeminiUsage;
}

export interface ExtractInput {
  markdown?: string;
  conversationText?: string;
  url?: string;
  existingImages?: string[];
  currentPropertyState?: Partial<ExtractedPropertyPayload>;
}

function generateKebabSlug(title: string, city: string): string {
  return `${slugify(`${title} ${city}`) || "property"}-${randomSlugSuffix()}`;
}

/**
 * Synthesizes a structured property profile, voice agent knowledge base, and concession guardrails.
 * Gemini only: throws when the key is missing, the call fails, or the response is empty. No offline fallback.
 * Following Real Estate Voice AI Best Practices:
 * - Factual Data ("Filing Cabinet") separation
 * - Spoken-optimized FAQs (concise 1-2 sentence answers)
 * - Exchange-of-value negotiation guardrails
 * - Safe fallback responses for unknown facts
 */
export async function extractPropertyKnowledgeBase(
  input: ExtractInput
): Promise<ExtractedPropertyPayload> {
  const current = input.currentPropertyState?.property;
  const currentKb = input.currentPropertyState?.knowledgeBase;

  const contentToAnalyze = [
    input.url ? `Source Listing URL: ${input.url}` : "",
    input.conversationText ? `Owner Interview Notes & Full Dialogue:\n${input.conversationText}` : "",
    input.markdown ? `Listing Content & Markdown:\n${input.markdown}` : "",
    current?.address
      ? `Existing Verified State from Live Session:
- Address: ${current.address}, ${current.city || ""} ${current.state || ""} ${current.zipCode || ""}
- Listing Type: ${current.listingType}
- Price: $${current.price}
- Beds: ${current.bedrooms}, Baths: ${current.bathrooms}, Sqft: ${current.sqft}
- Available Date: ${current.availableDate || "not specified"}
- Parking Setup: ${currentKb?.parkingDetail || "not specified"}
- Pet Policy: ${currentKb?.petPolicyDetail || "not specified"}
- Utilities: ${currentKb?.utilitiesDetail || "not specified"}
- Contact Email: ${currentKb?.contactEmail || "not specified"}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!contentToAnalyze.trim()) {
    throw new Error("No property content or notes provided for AI synthesis.");
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Knowledge-base synthesis runs on Gemini only; there is no offline fallback."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `
You are the Real Estate Intelligence Synthesizer & Truth Auditor for Kyron Realty AI.
Analyze the provided property input (URL markdown, owner dialogue notes, or verified state) and extract structured listing data, a conversational voice agent knowledge base, and concession guardrails.

CORE ZERO-HALLUCINATION & FACT-VS-COPY PRINCIPLES:
1. ATOMIC PROPERTY FACTS (STRICT EXTRACTION ONLY):
   - Extract: listingType ("rent" | "sale"), address, city, state, zipCode, price, bedrooms, bathrooms, sqft, yearBuilt.
   - ZERO-HALLUCINATION RULE: ONLY extract facts that are EXPLICITLY stated in the input.
   - If an atomic fact has not been stated, you MUST return 0 for numeric fields and "" for text fields.
   - NEVER invent or guess street addresses, prices, bedroom/bathroom counts, or square footage.
   - If analyzing a conversation transcript between an owner and Elena Vance, extract facts ONLY from what the owner states, NEVER from assistant suggestions or examples.

2. AUDIT & RECONCILIATION TASK:
   - Compare the full dialogue transcript against the Existing Verified State.
   - If a spec was agreed upon in the live session and never contradicted, KEEP IT as confirmed truth.
   - If the owner corrected or clarified any spec in the transcript (e.g. rent changed to $45,000, or pet policy allowed dogs), ensure the final agreed value is set.
   - If there is an outright conflict or contradiction between the live screen state and what the owner actually agreed in the transcript, report it in 'detectedDiscrepancies':
     [ { "field": string, "liveValue": string, "transcriptValue": string, "reason": string } ].
   - If everything is consistent with the transcript, return 'detectedDiscrepancies': [].

3. POLICIES & MOVE-IN TIMING:
   - parkingDetail, petPolicyDetail, utilitiesDetail: ONLY include details explicitly mentioned.
   - availableDate: Format cleanly (e.g. "Within 15 days", "In 15 Days", "Available Immediately").
   - PILL BUTTON LABELS: Provide concise 2–4 word UI button labels in 'pillLabels' (e.g. parking: "3-Car Parking", pets: "Dogs Allowed", utilities: "Water Included", availableDate: "In 15 Days", hoa: "No HOA").

4. CONVERSATIONAL COPY (GROUNDED SYNTHESIS):
   - synthesizedSalesPitch: A punchy 1-2 sentence conversational hook designed for natural spoken audio. Ground this strictly in the verified facts.
   - faqs: Include concise 1-2 sentence spoken answers grounded in verified facts. Always include safe fallback FAQ.

5. NEGOTIATION CONCESSION GUARDRAILS:
   - If price > 0, set targetPrice = price, and minFloorPrice = Math.round(price * 0.94).
   - If price === 0, set targetPrice = 0, minFloorPrice = 0, and concessionRules = [].

INPUT DATA:
${contentToAnalyze}

OUTPUT FORMAT:
Return a strictly valid JSON object matching this schema:
{
  "property": {
    "title": string,
    "description": string,
    "listingType": "rent" | "sale" | "",
    "propertyType": "apartment" | "single_family" | "condo" | "townhouse" | "commercial",
    "price": number,
    "securityDeposit": number,
    "minLeaseMonths": number,
    "hoaFeeMonthly": number,
    "address": string,
    "unitNumber": string,
    "city": string,
    "state": string,
    "zipCode": string,
    "country": "USA",
    "bedrooms": number,
    "bathrooms": number,
    "sqft": number,
    "yearBuilt": number,
    "availableDate": string,
    "amenities": string[],
    "features": string[],
    "coverImageUrl": string,
    "images": string[]
  },
  "knowledgeBase": {
    "synthesizedSalesPitch": string,
    "neighborhoodSummary": string,
    "schoolDistrictInfo": string,
    "petPolicyDetail": string,
    "parkingDetail": string,
    "utilitiesDetail": string,
    "applicationProcess": string,
    "faqs": [
      { "question": string, "answer": string, "category": "Pricing & Lease" | "Amenities & Specs" | "Policies & Rules" | "Neighborhood" }
    ],
    "agentTone": "warm_professional",
    "greetingMessage": string,
    "unknownFallbackPolicy": string
  },
  "pillLabels": {
    "parking": string,
    "pets": string,
    "utilities": string,
    "availableDate": string,
    "hoa": string
  },
  "detectedDiscrepancies": [
    {
      "field": string,
      "liveValue": string,
      "transcriptValue": string,
      "reason": string
    }
  ],
  "negotiationMatrix": {
    "allowNegotiation": true,
    "targetPrice": number,
    "minFloorPrice": number,
    "maxAllowedDiscountPct": number,
    "concessionRules": [
      {
        "condition": string,
        "concession": string,
        "maxConcessionValue": number,
        "requiresApproval": boolean
      }
    ],
    "notesForAgent": string
  }
}
  `.trim();

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const usage = computeGeminiCost(modelName, promptTokens, candidateTokens);

    const text = response.text || "";
    if (!text.trim()) {
      throw new Error("Gemini returned empty response text.");
    }

    const parsed = JSON.parse(text);

    // Step 2: Targeted Verification Pass if conflicts were detected between live state and transcript
    if (
      parsed.detectedDiscrepancies &&
      Array.isArray(parsed.detectedDiscrepancies) &&
      parsed.detectedDiscrepancies.length > 0 &&
      input.conversationText
    ) {
      try {
        const auditPrompt = `
You are the Real Estate Truth Auditor for Kyron Realty AI.
During post-call synthesis, the following potential discrepancies were flagged between the live property inspector and the conversation transcript:

FLAGGED DISCREPANCIES:
${JSON.stringify(parsed.detectedDiscrepancies, null, 2)}

FULL CONVERSATION TRANSCRIPT:
${input.conversationText}

TASK:
Examine the transcript to determine the owner's true agreed specifications for these flagged fields.
Resolve any mishearing, verbal correction, or ASR glitch.
Return valid JSON:
{
  "rectifiedSpecs": {
    "parkingDetail"?: string,
    "parkingPillText"?: string,
    "petPolicyDetail"?: string,
    "petPolicyPillText"?: string,
    "utilitiesDetail"?: string,
    "utilitiesPillText"?: string,
    "availableDate"?: string,
    "availableDatePillText"?: string,
    "price"?: number,
    "bedrooms"?: number,
    "bathrooms"?: number,
    "sqft"?: number,
    "address"?: string
  },
  "auditExplanation": string
}
`.trim();

        const auditResponse = await ai.models.generateContent({
          model: modelName,
          contents: auditPrompt,
          config: { responseMimeType: "application/json" },
        });

        if (auditResponse.text) {
          const auditParsed = JSON.parse(auditResponse.text);
          if (auditParsed.rectifiedSpecs) {
            const r = auditParsed.rectifiedSpecs;
            if (r.parkingDetail) parsed.knowledgeBase.parkingDetail = r.parkingDetail;
            if (r.parkingPillText) {
              parsed.pillLabels = { ...(parsed.pillLabels || {}), parking: r.parkingPillText };
            }
            if (r.petPolicyDetail) parsed.knowledgeBase.petPolicyDetail = r.petPolicyDetail;
            if (r.petPolicyPillText) {
              parsed.pillLabels = { ...(parsed.pillLabels || {}), pets: r.petPolicyPillText };
            }
            if (r.utilitiesDetail) parsed.knowledgeBase.utilitiesDetail = r.utilitiesDetail;
            if (r.utilitiesPillText) {
              parsed.pillLabels = { ...(parsed.pillLabels || {}), utilities: r.utilitiesPillText };
            }
            if (r.availableDate) parsed.property.availableDate = r.availableDate;
            if (r.availableDatePillText) {
              parsed.pillLabels = { ...(parsed.pillLabels || {}), availableDate: r.availableDatePillText };
            }
            if (typeof r.price === "number") parsed.property.price = r.price;
            if (typeof r.bedrooms === "number") parsed.property.bedrooms = r.bedrooms;
            if (typeof r.bathrooms === "number") parsed.property.bathrooms = r.bathrooms;
            if (typeof r.sqft === "number") parsed.property.sqft = r.sqft;
            if (r.address) parsed.property.address = r.address;
          }
        }
      } catch (auditErr) {
        console.warn("[Targeted Verification Audit Warning]:", auditErr);
      }
    }

    // Gemini's extraction wins; whatever the caller already verified fills the gaps
    const price = parsed.property?.price || current?.price || 0;
    const bedrooms = parsed.property?.bedrooms ?? current?.bedrooms ?? 0;
    const bathrooms = parsed.property?.bathrooms ?? current?.bathrooms ?? 0;
    const sqft = parsed.property?.sqft ?? current?.sqft ?? 0;
    const address = parsed.property?.address || current?.address || "";
    const listingType = parsed.property?.listingType || current?.listingType || "";
    const city = parsed.property?.city || current?.city || "";
    const state = parsed.property?.state || current?.state || "";
    const zipCode = parsed.property?.zipCode || current?.zipCode || "";

    const title =
      parsed.property?.title ||
      current?.title ||
      (address ? buildDefaultTitle(address, bedrooms) : "Real Estate Listing");
    const slug = generateKebabSlug(title, city || "property");

    // Merge existing images if found
    const combinedImages = Array.from(
      new Set([
        ...(parsed.property?.images || []),
        ...(input.existingImages || []),
        ...(current?.images || []),
      ])
    ).filter(Boolean);

    const targetPrice = price || Number(parsed.negotiationMatrix?.targetPrice) || 0;
    const minFloorPrice =
      targetPrice > 0
        ? parsed.negotiationMatrix?.minFloorPrice || computeFloorPrice(targetPrice)
        : 0;

    return {
      property: {
        ...parsed.property,
        title,
        slug,
        listingType,
        price,
        bedrooms,
        bathrooms,
        sqft,
        address,
        city,
        state,
        zipCode,
        coverImageUrl:
          parsed.property?.coverImageUrl ||
          current?.coverImageUrl ||
          combinedImages[0] ||
          "",
        images: combinedImages,
        amenities:
          parsed.property?.amenities && parsed.property.amenities.length > 0
            ? parsed.property.amenities
            : current?.amenities || [],
      },
      knowledgeBase: {
        ...parsed.knowledgeBase,
        contactEmail: parsed.knowledgeBase?.contactEmail || currentKb?.contactEmail || "",
        rawScrapedMarkdown: input.markdown || contentToAnalyze,
        pillLabels: parsed.pillLabels || parsed.knowledgeBase?.pillLabels,
      },
      negotiationMatrix: {
        ...parsed.negotiationMatrix,
        targetPrice,
        minFloorPrice,
      },
      usage,
    };
  } catch (err: any) {
    console.error(`[Gemini Extraction Error]:`, err.message || err);
    throw new Error(`Gemini synthesis error: ${err.message || err}`);
  }
}
