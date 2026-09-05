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
  const base = `${title} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "property"}-${randomSuffix}`;
}

function getQuestionFocus(
  question?: string
): "rent_or_sale" | "price" | "bedrooms" | "bathrooms" | "sqft" | "address" | null {
  if (!question || typeof question !== "string") return null;

  // Split into sentences / clauses and inspect the trailing clause
  const clauses = question
    .split(/[?.!]\s*|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const target = (clauses[clauses.length - 1] || question).toLowerCase();

  // 1. Price / Rent amount questions
  if (
    /\b(?:monthly\s*rent|asking\s*price|target\s*price|price\b|how\s*much|cost\b|budget\b|rate\b)\b/i.test(target)
  ) {
    return "price";
  }

  // 2. Listing type questions (Rent vs Sale)
  if (
    /\b(?:for\s*rent\s*or\s*(?:for\s*)?sale|rent\s*or\s*sale|renting\s*or\s*selling|rent\s*or\s*buy)\b/i.test(target) ||
    (/\b(?:rent|sale)\b/i.test(target) && /\b(?:is\s*(?:this|the\s*property)\s*for)\b/i.test(target))
  ) {
    return "rent_or_sale";
  }

  // 3. Bathrooms
  if (/\b(?:bathroom|bathrooms|baths|bath|toilets|toilet|washroom|washrooms|restroom|restrooms)\b/i.test(target)) {
    return "bathrooms";
  }

  // 4. Bedrooms
  if (/\b(?:bedroom|bedrooms|beds|bed|br)\b/i.test(target)) {
    return "bedrooms";
  }

  // 5. Sqft / Size
  if (/\b(?:square\s*feet|square\s*foot|sqft|sq\s*ft|footage|size|area|how\s*big|square)\b/i.test(target)) {
    return "sqft";
  }

  // 6. Address / Location
  if (/\b(?:address|location|where\s*is|street|located|where's|neighborhood|city)\b/i.test(target)) {
    return "address";
  }

  return null;
}

function parseSpokenNumber(text: string): number | null {
  const cleaned = text.toLowerCase().trim().replace(/[,.]/g, "");
  const digitMatch = cleaned.match(/\b([0-9]+)\b/);
  if (digitMatch) return Number(digitMatch[1]);

  const wordMap: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
    eighty: 80, ninety: 90,
  };

  if (wordMap[cleaned] !== undefined) return wordMap[cleaned];

  if (cleaned.includes("thousand")) {
    const parts = cleaned.split("thousand").map((p) => p.trim());
    const base = wordMap[parts[0]] || 1;
    const rem = parts[1] && wordMap[parts[1]] ? wordMap[parts[1]] : 0;
    return base * 1000 + rem;
  }

  return null;
}

/**
 * Deterministic real-time attribute extractor for instantaneous (<10ms) hands-free voice updates.
 * Parses listing type, price, beds, baths, sqft, and address from spoken user text with question context.
 */
export function extractHeuristicAttributes(
  text: string,
  prevProperty?: Partial<ExtractedPropertyPayload["property"]>,
  lastAssistantQuestion?: string
): Partial<ExtractedPropertyPayload["property"]> {
  const updates: Partial<ExtractedPropertyPayload["property"]> = {};
  if (!text || typeof text !== "string") return updates;

  const lower = text.toLowerCase().trim();
  const focus = getQuestionFocus(lastAssistantQuestion);

  // 1. Listing Type
  if (
    /\b(?:for rent|to rent|rental|for lease|to lease)\b/i.test(lower) ||
    /\b(?:renting|rent is|per month|\/mo|a month)\b/i.test(lower) ||
    (focus === "rent_or_sale" && /\brent\b/i.test(lower) && !/\bsale\b/i.test(lower))
  ) {
    updates.listingType = "rent";
  } else if (
    /\b(?:for sale|to buy|selling|purchase|asking price|to purchase)\b/i.test(lower) ||
    (focus === "rent_or_sale" && /\bsale\b/i.test(lower) && !/\brent\b/i.test(lower))
  ) {
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
    } else if (focus === "price") {
      // Standalone number or spoken amount when answering a price question
      const standaloneNumMatch = text.match(
        /(?:^|\b)(?:it's|it is|about|around)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,7})\b/i
      );
      if (standaloneNumMatch && standaloneNumMatch[1]) {
        parsedPrice = Number(standaloneNumMatch[1].replace(/,/g, ""));
      } else {
        const spokenVal = parseSpokenNumber(text);
        if (spokenVal && spokenVal >= 100) {
          parsedPrice = spokenVal;
        }
      }
    }
  }
  if (parsedPrice && parsedPrice >= 100) {
    updates.price = parsedPrice;
  }

  // 3. Bedrooms
  // Matches "2 beds", "2 bed", "2 bedrooms", "two bedrooms", "studio"
  if (/\b(?:studio|alcove\s*studio)\b/i.test(text)) {
    updates.bedrooms = 0;
  } else {
    const bedWordMap: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
    };
    const bedRegex =
      /\b([0-9]+|one|two|three|four|five|six)\s*(?:bed|beds|bedroom|bedrooms|br)\b/i;
    const bedMatch = text.match(bedRegex);
    if (bedMatch && bedMatch[1]) {
      const word = bedMatch[1].toLowerCase();
      updates.bedrooms = bedWordMap[word] !== undefined ? bedWordMap[word] : Number(word);
    } else if (focus === "bedrooms") {
      const num = parseSpokenNumber(text);
      if (num !== null && num >= 0 && num <= 20) {
        updates.bedrooms = num;
      }
    }
  }

  // 4. Bathrooms
  // Matches "2 baths", "2.5 bathrooms", "two baths", "1.5 ba", "2 toilets", "2 washrooms"
  const bathWordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  const bathRegex =
    /\b([0-9]+(?:\.[0-9]+)?|one|two|three|four|five)\s*(?:bath|baths|bathroom|bathrooms|ba|toilet|toilets|washroom|washrooms|restroom|restrooms|powder\s*room)\b/i;
  const bathMatch = text.match(bathRegex);
  if (bathMatch && bathMatch[1]) {
    const word = bathMatch[1].toLowerCase();
    updates.bathrooms = bathWordMap[word] !== undefined ? bathWordMap[word] : Number(word);
  } else if (focus === "bathrooms") {
    const num = parseSpokenNumber(text);
    if (num !== null && num >= 1 && num <= 15) {
      updates.bathrooms = num;
    }
  }

  // 5. Square footage / Size
  // Matches "1,200 sqft", "1200 square feet", "850 sf", "1,500 sq ft", "1100 square"
  const sqftRegex =
    /\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})\s*(?:sq\s*ft|sqft|square\s*feet|square\s*foot|sf|square)\b/i;
  const sqftMatch = text.match(sqftRegex);
  if (sqftMatch && sqftMatch[1]) {
    updates.sqft = Number(sqftMatch[1].replace(/,/g, ""));
  } else if (focus === "sqft") {
    const standaloneSqft = text.match(/\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,5})\b/);
    if (standaloneSqft && standaloneSqft[1]) {
      updates.sqft = Number(standaloneSqft[1].replace(/,/g, ""));
    }
  }

  // 6. Street Address & Location
  if (focus === "address") {
    // Strip common leading conversational phrases
    const cleanAddr = text
      .replace(/^(?:it's|it is|the address is|address is|located at|at)\s+/i, "")
      .replace(/[.]+$/, "")
      .trim();

    if (cleanAddr.length > 3) {
      const parts = cleanAddr.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        updates.city = parts[parts.length - 1];
        updates.address = parts.slice(0, parts.length - 1).join(", ");
      } else {
        updates.address = cleanAddr;
      }
    }
  } else {
    // Regex fallback for US street addresses in unprompted utterances
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
  }

  // 7. Zip code extraction (PROTECTED AGAINST PRICE/RENT COLLISION)
  // Never extract 5-digit number as zip if answering price, or if number equals parsedPrice
  if (focus !== "price") {
    const zipMatch = text.match(/\b([0-9]{5})\b/);
    if (zipMatch && zipMatch[1]) {
      const candidateZip = zipMatch[1];
      if (parsedPrice === null || Number(candidateZip) !== parsedPrice) {
        // Only treat as zip if in address context or explicitly preceded by zip/state
        if (
          focus === "address" ||
          /\b(?:zip|zipcode|postal)\b/i.test(text) ||
          /[A-Z]{2}\s+[0-9]{5}\b/.test(text)
        ) {
          updates.zipCode = candidateZip;
        }
      }
    }
  }

  // Auto-generate title only if address is found; do not assume "for rent"
  const effectiveBeds = updates.bedrooms ?? prevProperty?.bedrooms;
  const effectiveAddress = updates.address ?? prevProperty?.address;
  const effectiveType = updates.listingType ?? prevProperty?.listingType;

  if (effectiveAddress && !prevProperty?.title) {
    const typeLabel = effectiveType
      ? effectiveType === "rent"
        ? "Residence for Rent"
        : "Residence for Sale"
      : "Residence";
    updates.title = `${effectiveBeds ? `${effectiveBeds}-Bedroom ` : ""}${typeLabel} at ${effectiveAddress}`;
  }

  return updates;
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
  const currentMatrix = input.currentPropertyState?.negotiationMatrix;

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
    const heuristic = extractHeuristicAttributes(input.conversationText || input.markdown || "", current);
    const targetPrice = heuristic.price || current?.price || 0;
    const floorPrice = targetPrice > 0 ? Math.round(targetPrice * 0.94) : 0;

    return {
      property: {
        title: heuristic.title || current?.title || (heuristic.address ? `Residence at ${heuristic.address}` : ""),
        slug: generateKebabSlug(heuristic.title || heuristic.address || "property", heuristic.city || ""),
        description: current?.description || "",
        listingType: heuristic.listingType || current?.listingType || ("" as any),
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
      (address ? `${bedrooms ? `${bedrooms}-Bedroom ` : ""}Residence at ${address}` : "Real Estate Listing");
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
        ? parsed.negotiationMatrix?.minFloorPrice || Math.round(targetPrice * 0.94)
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
    const heuristic = extractHeuristicAttributes(input.conversationText || input.markdown || "", current);
    const targetPrice = heuristic.price || current?.price || 0;
    const floorPrice = targetPrice > 0 ? Math.round(targetPrice * 0.94) : 0;

    return {
      property: {
        title: heuristic.title || current?.title || (heuristic.address ? `Residence at ${heuristic.address}` : ""),
        slug: generateKebabSlug(heuristic.title || heuristic.address || "property", heuristic.city || ""),
        description: current?.description || "",
        listingType: heuristic.listingType || current?.listingType || ("" as any),
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
}

export interface TurnMessage {
  role: "assistant" | "user";
  text: string;
}

export interface ExtractTurnInput {
  slidingWindowMessages: TurnMessage[];
  currentPropertyState?: Partial<ExtractedPropertyPayload["property"]>;
}

export interface TurnSpecUpdates {
  listingType?: "rent" | "sale";
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Asynchronous, out-of-band turn extractor powered by Gemini 3.5 Flash-Lite.
 * Uses a sliding window of recent role-labeled turns ([ELENA VANCE] and [OWNER])
 * to repair ASR phonetic speech-to-text slips through conversational question & confirmation context.
 */
export async function extractTurnSpecs(
  input: ExtractTurnInput
): Promise<{ updates: TurnSpecUpdates }> {
  const { slidingWindowMessages, currentPropertyState } = input;

  if (!slidingWindowMessages || slidingWindowMessages.length === 0) {
    return { updates: {} };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("[Turn Extraction] Missing GEMINI_API_KEY in environment.");
    return { updates: {} };
  }

  const formattedDialogue = slidingWindowMessages
    .map((m) => `[${m.role === "assistant" ? "ELENA VANCE" : "OWNER"}]: ${m.text}`)
    .join("\n");

  const currentVerifiedSummary = currentPropertyState
    ? `
CURRENT VERIFIED STATE:
- listingType: ${currentPropertyState.listingType || "pending"}
- address: ${currentPropertyState.address || "pending"}
- price: ${currentPropertyState.price ? `$${currentPropertyState.price}` : "pending"}
- bedrooms: ${currentPropertyState.bedrooms !== undefined && currentPropertyState.bedrooms !== null ? currentPropertyState.bedrooms : "pending"}
- bathrooms: ${currentPropertyState.bathrooms !== undefined && currentPropertyState.bathrooms !== null ? currentPropertyState.bathrooms : "pending"}
- sqft: ${currentPropertyState.sqft ? `${currentPropertyState.sqft} sqft` : "pending"}
`.trim()
    : "";

  const prompt = `
You are the Real Estate Turn Extractor for Kyron Realty AI.
Your job is to analyze the recent conversation turns between Elena Vance (AI Real Estate Specialist) and the property owner, and extract or update any of the 6 core listing specifications:
1. listingType: "rent" or "sale"
2. price: target price or monthly rent number (e.g. 3500)
3. bedrooms: bedroom count number (e.g. 2, 0 for studio)
4. bathrooms: bathroom count number (e.g. 1.5, 2)
5. sqft: interior square footage number (e.g. 1200)
6. address: street address (e.g. "250 Marina Blvd")
Optional location fields: city, state, zipCode.

CRITICAL INSTRUCTIONS FOR DIALOGUE REASONING & ASR ROBUSTNESS:
- Dialogue is labeled with [ELENA VANCE] and [OWNER].
- Automatic Speech Recognition (ASR) phonetic slips: Spoken owner words may be transcribed with slight errors (e.g. "It's Oren" instead of "It's for rent"). Use Elena's subsequent confirmations and preceding questions as context to disambiguate the owner's true intent.
- Extract facts EXCLUSIVELY from what the owner states or agrees to. Never treat Elena's hypothetical examples as facts.
- Check the ENTIRE provided sliding window: If ANY of the specifications above were mentioned, answered, or corrected by the owner anywhere in the provided dialogue, include them in "updates".
- If no property specs were mentioned or changed in this dialogue, return an empty "updates" object: { "updates": {} }.

${currentVerifiedSummary}

RECENT DIALOGUE (Sliding Window):
${formattedDialogue}
`.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            updates: {
              type: "object",
              properties: {
                listingType: { type: "string", enum: ["rent", "sale"] },
                price: { type: "number" },
                bedrooms: { type: "number" },
                bathrooms: { type: "number" },
                sqft: { type: "number" },
                address: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
              },
            },
          },
          required: ["updates"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      updates: parsed.updates || {},
    };
  } catch (err: any) {
    console.error("[Turn Extraction Error]:", err.message || err);
    return { updates: {} };
  }
}

