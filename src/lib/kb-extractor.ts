import { GoogleGenAI } from "@google/genai";
import {
  buildDefaultTitle,
  computeFloorPrice,
  ListingType,
  randomSlugSuffix,
  slugify,
} from "./listing-helpers";

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

const COUNT_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

function parseCountWord(word: string): number {
  return COUNT_WORDS[word.toLowerCase()] ?? Number(word);
}

/**
 * Deterministic real-time attribute extractor for instantaneous (<10ms) hands-free voice updates.
 * Parses listing type, price, beds, baths, sqft, and address from spoken user text.
 */
function extractHeuristicAttributes(
  text: string,
  prevProperty?: Partial<ExtractedPropertyPayload["property"]>
): Partial<ExtractedPropertyPayload["property"]> {
  const updates: Partial<ExtractedPropertyPayload["property"]> = {};
  if (!text || typeof text !== "string") return updates;

  const lower = text.toLowerCase().trim();

  // 1. Listing Type
  if (
    /\b(?:for rent|to rent|rental|for lease|to lease)\b/i.test(lower) ||
    /\b(?:renting|rent is|per month|\/mo|a month)\b/i.test(lower)
  ) {
    updates.listingType = "rent";
  } else if (/\b(?:for sale|to buy|selling|purchase|asking price|to purchase)\b/i.test(lower)) {
    updates.listingType = "sale";
  }

  // 2. Target Price / Rent
  let parsedPrice: number | null = null;
  const dollarMatch = text.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\.[0-9]{2})?)/);
  if (dollarMatch && dollarMatch[1]) {
    parsedPrice = Number(dollarMatch[1].replace(/,/g, ""));
  } else {
    const wordPriceMatch = text.match(
      /\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,7})\s*(?:dollars|bucks|per\s*month|\/mo|\/month|monthly|a\s*month)\b/i
    );
    if (wordPriceMatch && wordPriceMatch[1]) {
      parsedPrice = Number(wordPriceMatch[1].replace(/,/g, ""));
    }
  }
  if (parsedPrice && parsedPrice >= 100) {
    updates.price = parsedPrice;
  }

  // 3. Bedrooms — "2 beds", "2 bedrooms", "two bedrooms", "studio"
  if (/\b(?:studio|alcove\s*studio)\b/i.test(text)) {
    updates.bedrooms = 0;
  } else {
    const bedMatch = text.match(/\b([0-9]+|one|two|three|four|five|six)\s*(?:bed|beds|bedroom|bedrooms|br)\b/i);
    if (bedMatch && bedMatch[1]) {
      updates.bedrooms = parseCountWord(bedMatch[1]);
    }
  }

  // 4. Bathrooms — "2 baths", "2.5 bathrooms", "two baths", "1.5 ba", "2 washrooms"
  const bathMatch = text.match(
    /\b([0-9]+(?:\.[0-9]+)?|one|two|three|four|five)\s*(?:bath|baths|bathroom|bathrooms|ba|toilet|toilets|washroom|washrooms|restroom|restrooms|powder\s*room)\b/i
  );
  if (bathMatch && bathMatch[1]) {
    updates.bathrooms = parseCountWord(bathMatch[1]);
  }

  // 5. Square footage — "1,200 sqft", "1200 square feet", "850 sf"
  const sqftMatch = text.match(
    /\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})\s*(?:sq\s*ft|sqft|square\s*feet|square\s*foot|sf|square)\b/i
  );
  if (sqftMatch && sqftMatch[1]) {
    updates.sqft = Number(sqftMatch[1].replace(/,/g, ""));
  }

  // 6. US street address in unprompted utterances
  const streetRegex =
    /(?:\bat\s+)?([0-9]{1,5}\s+[A-Za-z\s]+?\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Terrace|Ter|Circle|Cir)\b)/i;
  const streetMatch = text.match(streetRegex);
  if (streetMatch && streetMatch[1]) {
    updates.address = streetMatch[1].trim();
    const afterAddress = text.substring((streetMatch.index || 0) + streetMatch[0].length);
    const cityMatch = afterAddress.match(/,\s*([A-Za-z\s]+?)(?:,\s*([A-Z]{2}))?(?:\s+[0-9]{5})?(?:[.,]|$)/);
    if (cityMatch && cityMatch[1]) {
      updates.city = cityMatch[1].trim();
      if (cityMatch[2]) updates.state = cityMatch[2].trim();
    }
  }

  // 7. Zip code — only in explicit zip/state context, and never the number already parsed as the price
  const zipMatch = text.match(/\b([0-9]{5})\b/);
  if (zipMatch && zipMatch[1]) {
    const candidateZip = zipMatch[1];
    if (
      (parsedPrice === null || Number(candidateZip) !== parsedPrice) &&
      (/\b(?:zip|zipcode|postal)\b/i.test(text) || /[A-Z]{2}\s+[0-9]{5}\b/.test(text))
    ) {
      updates.zipCode = candidateZip;
    }
  }

  // Auto-generate title only if address is found; do not assume "for rent"
  const effectiveBeds = updates.bedrooms ?? prevProperty?.bedrooms;
  const effectiveAddress = updates.address ?? prevProperty?.address;
  const effectiveType = updates.listingType ?? prevProperty?.listingType;

  if (effectiveAddress && !prevProperty?.title) {
    updates.title = buildDefaultTitle(effectiveAddress, effectiveBeds, effectiveType);
  }

  return updates;
}

/**
 * Deterministic payload used when Gemini is unavailable or fails: heuristic specs
 * layered over whatever the caller already verified. Never invents facts.
 */
function buildHeuristicFallback(input: ExtractInput): ExtractedPropertyPayload {
  const current = input.currentPropertyState?.property;
  const currentKb = input.currentPropertyState?.knowledgeBase;
  const currentMatrix = input.currentPropertyState?.negotiationMatrix;
  const heuristic = extractHeuristicAttributes(input.conversationText || input.markdown || "", current);
  const targetPrice = heuristic.price || current?.price || 0;
  const floorPrice = computeFloorPrice(targetPrice);

  return {
    property: {
      title: heuristic.title || current?.title || (heuristic.address ? buildDefaultTitle(heuristic.address) : ""),
      slug: generateKebabSlug(heuristic.title || heuristic.address || "property", heuristic.city || ""),
      description: current?.description || "",
      listingType: heuristic.listingType || current?.listingType || "",
      propertyType: current?.propertyType || "apartment",
      price: targetPrice,
      securityDeposit: current?.securityDeposit || 0,
      minLeaseMonths: current?.minLeaseMonths || 12,
      hoaFeeMonthly: current?.hoaFeeMonthly || 0,
      address: heuristic.address || current?.address || "",
      unitNumber: current?.unitNumber || "",
      city: heuristic.city || current?.city || "",
      state: heuristic.state || current?.state || "",
      zipCode: heuristic.zipCode || current?.zipCode || "",
      country: "USA",
      bedrooms: heuristic.bedrooms ?? current?.bedrooms ?? 0,
      bathrooms: heuristic.bathrooms ?? current?.bathrooms ?? 0,
      sqft: heuristic.sqft ?? current?.sqft ?? 0,
      yearBuilt: current?.yearBuilt || 0,
      amenities: current?.amenities || [],
      features: current?.features || [],
      coverImageUrl: current?.coverImageUrl || "",
      images: current?.images || [],
    },
    knowledgeBase: {
      rawScrapedMarkdown: input.markdown || "",
      synthesizedSalesPitch: currentKb?.synthesizedSalesPitch || "",
      neighborhoodSummary: currentKb?.neighborhoodSummary || "",
      schoolDistrictInfo: currentKb?.schoolDistrictInfo || "",
      petPolicyDetail: currentKb?.petPolicyDetail || "",
      parkingDetail: currentKb?.parkingDetail || "",
      utilitiesDetail: currentKb?.utilitiesDetail || "",
      applicationProcess: currentKb?.applicationProcess || "",
      contactEmail: currentKb?.contactEmail || "",
      faqs: currentKb?.faqs || [],
      agentTone: "warm_professional",
      greetingMessage: currentKb?.greetingMessage || "",
      unknownFallbackPolicy:
        "Offer licensed broker follow-up rather than guessing unverified property specs.",
    },
    negotiationMatrix: {
      allowNegotiation: true,
      targetPrice,
      minFloorPrice: floorPrice,
      maxAllowedDiscountPct: 6.0,
      concessionRules: currentMatrix?.concessionRules || [],
      notesForAgent: floorPrice > 0 ? `Strict floor price lock at $${floorPrice}.` : "",
    },
  };
}

/**
 * Synthesizes a structured property profile, voice agent knowledge base, and concession guardrails.
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

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  // Fallback heuristic if API key is missing or offline
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    console.warn("GEMINI_API_KEY missing, using deterministic heuristic fallback.");
    return buildHeuristicFallback(input);
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

    // Apply heuristic overrides for any explicitly spoken details
    const heuristic = extractHeuristicAttributes(input.conversationText || "", current);

    const price = parsed.property?.price || heuristic.price || current?.price || 0;
    const bedrooms = parsed.property?.bedrooms ?? heuristic.bedrooms ?? current?.bedrooms ?? 0;
    const bathrooms = parsed.property?.bathrooms ?? heuristic.bathrooms ?? current?.bathrooms ?? 0;
    const sqft = parsed.property?.sqft ?? heuristic.sqft ?? current?.sqft ?? 0;
    const address = parsed.property?.address || heuristic.address || current?.address || "";
    const listingType =
      parsed.property?.listingType || heuristic.listingType || current?.listingType || "";
    const city = parsed.property?.city || heuristic.city || current?.city || "";
    const state = parsed.property?.state || heuristic.state || current?.state || "";
    const zipCode = parsed.property?.zipCode || heuristic.zipCode || current?.zipCode || "";

    const title =
      parsed.property?.title ||
      heuristic.title ||
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
    // Graceful fallback to heuristic extraction to ensure uninterrupted onboarding flow
    return buildHeuristicFallback(input);
  }
}
