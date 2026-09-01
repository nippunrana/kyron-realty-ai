import { GoogleGenAI } from "@google/genai";

export interface ExtractedPropertyPayload {
  property: {
    title: string;
    slug: string;
    description: string;
    listingType: "rent" | "sale";
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
    faqs: Array<{ question: string; answer: string; category: string }>;
    agentTone: string;
    greetingMessage: string;
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

function generateKebabSlug(title: string, city: string): string {
  const base = `${title} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "property"}-${randomSuffix}`;
}

/**
 * Synthesizes a structured property profile, voice agent knowledge base, and concession guardrails.
 * Strict Mode: Directly invokes Gemini 2.5 and throws immediately on missing API key or generation failure.
 */
export async function extractPropertyKnowledgeBase(
  input: {
    markdown?: string;
    conversationText?: string;
    url?: string;
    existingImages?: string[];
  }
): Promise<ExtractedPropertyPayload> {
  const contentToAnalyze = [
    input.url ? `Source Listing URL: ${input.url}` : "",
    input.conversationText ? `Owner Interview Notes:\n${input.conversationText}` : "",
    input.markdown ? `Listing Content & Markdown:\n${input.markdown}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!contentToAnalyze.trim()) {
    throw new Error("No property content or notes provided for AI synthesis.");
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "Missing GEMINI_API_KEY in .env. Please configure a valid Google Gemini API key from https://aistudio.google.com/app/apikey."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert real estate intelligence system and senior property manager.
Analyze the following raw real estate listing content / owner conversation and extract an exhaustive, structured property profile, a speech-optimized knowledge base for an Agora voice sales agent, and a negotiation guardrail matrix.

Input Content:
${contentToAnalyze}

You MUST return a valid JSON object strictly matching this TypeScript structure (do not enclose in markdown ticks if using json mime type, or return clean JSON):
{
  "property": {
    "title": string (e.g. "Luxury 2-Bedroom Marina Loft with Bay Views"),
    "description": string (compelling 2-3 paragraph listing description),
    "listingType": "rent" | "sale",
    "propertyType": "apartment" | "single_family" | "condo" | "townhouse" | "commercial",
    "price": number (numeric value only, e.g. 3450),
    "securityDeposit": number,
    "minLeaseMonths": number (default 12),
    "hoaFeeMonthly": number (default 0),
    "address": string (e.g. "250 Marina Boulevard"),
    "unitNumber": string (e.g. "Unit 4B" or ""),
    "city": string (e.g. "San Francisco"),
    "state": string (e.g. "CA"),
    "zipCode": string (e.g. "94123"),
    "country": string (default "USA"),
    "bedrooms": number,
    "bathrooms": number,
    "sqft": number,
    "yearBuilt": number,
    "availableDate": string (ISO date or "Immediate"),
    "amenities": string[] (e.g. ["In-unit W/D", "Garage Parking", "EV Charging", "Balcony", "Rooftop Pool"]),
    "features": string[] (e.g. ["Hardwood flooring", "Floor-to-ceiling windows", "Quartz countertops"]),
    "coverImageUrl": string,
    "images": string[] (array of image URLs found or empty array)
  },
  "knowledgeBase": {
    "synthesizedSalesPitch": string (punchy 2-sentence conversational hook designed to be spoken aloud naturally by a voice agent),
    "neighborhoodSummary": string (walkability, restaurants, transit, vibe),
    "schoolDistrictInfo": string,
    "petPolicyDetail": string (detailed rules, fees, weight limits),
    "parkingDetail": string (assigned spots, guest parking, garage type),
    "utilitiesDetail": string (what is included vs paid by tenant/buyer),
    "applicationProcess": string (requirements, screening, deposit),
    "faqs": [
      { "question": string, "answer": string, "category": "Pricing & Lease" | "Amenities & Specs" | "Policies & Rules" | "Neighborhood" }
    ],
    "agentTone": "warm_professional",
    "greetingMessage": string (e.g. "Hello! Thanks for your interest in 250 Marina Blvd. Are you looking to move in this month?")
  },
  "negotiationMatrix": {
    "allowNegotiation": true,
    "targetPrice": number (matches property.price),
    "minFloorPrice": number (strict minimum allowed price, usually 5-7% below target),
    "maxAllowedDiscountPct": number (e.g. 5.0),
    "concessionRules": [
      {
        "condition": "18_month_lease",
        "concession": "5% discount on monthly rent",
        "maxConcessionValue": 200,
        "requiresApproval": false
      },
      {
        "condition": "move_in_under_7_days",
        "concession": "Waived first month parking fee ($200 value)",
        "maxConcessionValue": 200,
        "requiresApproval": false
      }
    ],
    "notesForAgent": string (internal guidelines for the voice bot)
  }
}
  `.trim();

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    if (!text.trim()) {
      throw new Error("Gemini returned empty response text.");
    }

    const parsed = JSON.parse(text);

    const title = parsed.property?.title || "Real Estate Listing";
    const city = parsed.property?.city || "San Francisco";
    const slug = generateKebabSlug(title, city);

    // Merge existing images if found
    const combinedImages = Array.from(
      new Set([
        ...(parsed.property?.images || []),
        ...(input.existingImages || []),
      ])
    ).filter(Boolean);

    return {
      property: {
        ...parsed.property,
        slug,
        coverImageUrl:
          parsed.property?.coverImageUrl ||
          combinedImages[0] ||
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        images:
          combinedImages.length > 0
            ? combinedImages
            : [
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
              ],
      },
      knowledgeBase: {
        ...parsed.knowledgeBase,
        rawScrapedMarkdown: input.markdown || contentToAnalyze,
      },
      negotiationMatrix: parsed.negotiationMatrix,
    };
  } catch (err: any) {
    console.error(`[Gemini Extraction Error]:`, err.message || err);
    throw new Error(`Gemini AI extraction error: ${err.message || err}`);
  }
}
