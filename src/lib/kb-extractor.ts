import { GoogleGenAI } from "@google/genai";
import {
  buildDefaultTitle,
  computeFloorPrice,
  ListingType,
  randomSlugSuffix,
  slugify,
} from "./listing-helpers";
import { getGeminiApiKey } from "./gemini";

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
    input.conversationText ? `Owner Interview Notes & Conversation:\n${input.conversationText}` : "",
    input.markdown ? `Listing Content & Markdown:\n${input.markdown}` : "",
    current?.address
      ? `Existing Verified State:\n- Address: ${current.address}, ${current.city || ""}\n- Type: ${
          current.listingType
        }\n- Price: $${current.price}\n- Beds: ${current.bedrooms}, Baths: ${
          current.bathrooms
        }, Sqft: ${current.sqft}`
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
You are the Real Estate Intelligence Synthesizer for Kyron Realty AI.
Analyze the provided property input (URL markdown, owner dialogue notes, or verified state) and extract structured listing data, a conversational voice agent knowledge base, and concession guardrails.

CORE ZERO-HALLUCINATION & FACT-VS-COPY PRINCIPLES:
1. ATOMIC PROPERTY FACTS (STRICT EXTRACTION ONLY):
   - Extract: listingType ("rent" | "sale"), address, city, state, zipCode, price, bedrooms, bathrooms, sqft, yearBuilt.
   - ZERO-HALLUCINATION RULE: ONLY extract facts that are EXPLICITLY stated in the input.
   - If an atomic fact has not been stated, you MUST return 0 for numeric fields and "" for text fields.
   - NEVER invent or guess street addresses, prices, bedroom/bathroom counts, or square footage (e.g. NEVER output "123 Main Street" or fictional rents).
   - If analyzing a conversation transcript between an owner and the assistant, extract facts ONLY from what the owner states, NEVER from assistant suggestions, examples, or greetings.

2. SEMI-FACTUAL POLICIES & LOCAL DETAILS:
   - For petPolicyDetail, parkingDetail, utilitiesDetail, neighborhoodSummary, and schoolDistrictInfo:
   - ONLY include details explicitly mentioned by the owner or in the listing markdown.
   - If not mentioned, set them to empty string "". NEVER assume utilities are included or invent pet policies.

3. CONVERSATIONAL COPY (GROUNDED SYNTHESIS):
   - synthesizedSalesPitch: A punchy 1-2 sentence conversational hook designed for natural spoken audio. Ground this strictly in the verified facts (address, price, specs). If no core specs are known yet, leave it empty "".
   - faqs: Include concise 1-2 sentence spoken answers grounded in verified facts. Always include this safe fallback FAQ:
     Q: "What if a caller asks about something not listed in the knowledge base?"
     A: "I don't have that specific detail in our verified records, but I can have our licensed broker follow up with you directly today. Would you like me to note your contact info?"

4. NEGOTIATION CONCESSION GUARDRAILS:
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
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    if (!text.trim()) {
      throw new Error("Gemini returned empty response text.");
    }

    const parsed = JSON.parse(text);

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
      },
      negotiationMatrix: {
        ...parsed.negotiationMatrix,
        targetPrice,
        minFloorPrice,
      },
    };
  } catch (err: any) {
    console.error(`[Gemini Extraction Error]:`, err.message || err);
    throw new Error(`Gemini synthesis error: ${err.message || err}`);
  }
}
