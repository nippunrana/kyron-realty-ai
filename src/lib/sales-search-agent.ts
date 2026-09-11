import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./gemini";

export interface SalesSearchCriteria {
  city: string | null;
  petFriendly: boolean | null;
  bedrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  listingType: "rent" | "sale" | null;
  propertyType: string | null;
  keywords: string[];
  missingCity: boolean;
  summary: string;
}

export interface SalesSearchInput {
  userSpeech: string;
  conversationHistory?: Array<{ role: "user" | "assistant" | "system"; text: string }>;
  activeCriteria?: Partial<SalesSearchCriteria>;
}

/**
 * Resilient regex-based fallback in case Gemini is unreachable or unconfigured.
 */
function fallbackExtractCriteria(
  text: string,
  historyText: string,
  activeCriteria?: Partial<SalesSearchCriteria>
): SalesSearchCriteria {
  const combined = `${historyText} ${text}`.toLowerCase();

  // Reset intent check
  const isReset = /\b(clear filters?|reset filters?|remove filters?|show all properties|show all|show everything)\b/i.test(text);

  // Common Indian and global cities
  const cityMatch = combined.match(/\b(faridabad|delhi|gurugram|gurgaon|noida|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata)\b/i);
  const city = cityMatch
    ? cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase()
    : activeCriteria?.city || null;

  if (isReset) {
    return {
      city,
      petFriendly: null,
      bedrooms: null,
      minPrice: null,
      maxPrice: null,
      listingType: null,
      propertyType: null,
      keywords: [],
      missingCity: !city,
      summary: city ? `All properties in ${city}` : "All properties",
    };
  }

  const petMentioned = /\b(pet|pets|dog|dogs|cat|cats|pet-friendly|pet friendly)\b/i.test(text);
  const petNegative = /\b(no pet|remove pet|any pet|without pet)\b/i.test(text);
  let petFriendly = activeCriteria?.petFriendly ?? null;
  if (petMentioned) petFriendly = !petNegative;

  const isRent = /\b(rent|lease|rental|renting)\b/i.test(text);
  const isSale = /\b(buy|purchase|sale|selling)\b/i.test(text);
  let listingType = activeCriteria?.listingType ?? null;
  if (isRent) listingType = "rent";
  else if (isSale) listingType = "sale";

  const bedMatch = text.match(/(\d+)\s*(bhk|bed|bedroom|bedrooms)/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1], 10) : (activeCriteria?.bedrooms ?? null);

  const isSearchIntent = /\b(property|properties|place|places|flat|flats|apartment|apartments|house|home|listing|listings|find|show|look|search|available|any)\b/i.test(combined);
  const missingCity = isSearchIntent && !city;

  return {
    city,
    petFriendly,
    bedrooms,
    minPrice: activeCriteria?.minPrice ?? null,
    maxPrice: activeCriteria?.maxPrice ?? null,
    listingType,
    propertyType: activeCriteria?.propertyType ?? null,
    keywords: activeCriteria?.keywords || [],
    missingCity,
    summary: city
      ? `${petFriendly ? "Pet-friendly " : ""}${bedrooms ? `${bedrooms} BHK ` : ""}properties in ${city}`
      : "Property search query",
  };
}

/**
 * Refactors and structures real-time sales conversation turns into precise DB search criteria.
 */
export async function refactorSalesSearchQuery(input: SalesSearchInput): Promise<SalesSearchCriteria> {
  const { userSpeech, conversationHistory = [], activeCriteria } = input;
  const apiKey = getGeminiApiKey();

  const historyFormatted = conversationHistory
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  if (!apiKey) {
    return fallbackExtractCriteria(userSpeech, historyFormatted, activeCriteria);
  }

  const prompt = `
You are an intelligent real estate search intent refactoring engine for Kyron Realty AI.
Analyze the user's latest speech and recent conversation history to extract structured property search parameters.

CURRENT ACTIVE SEARCH CONTEXT:
- Active City: ${activeCriteria?.city || "None"}
- Active Pet-Friendly Filter: ${activeCriteria?.petFriendly ?? "None"}
- Active Bedrooms: ${activeCriteria?.bedrooms ?? "None"}
- Active Listing Type: ${activeCriteria?.listingType ?? "None"}
- Active Price: min=${activeCriteria?.minPrice || "None"}, max=${activeCriteria?.maxPrice || "None"}

CRITICAL RULES:
1. 'city':
   - If the user explicitly names a new city (e.g., "now check Delhi"), extract that new city.
   - If no new city is named, and an Active City is present in context, RETAIN the Active City (sticky context).
2. 'missingCity':
   - Set to TRUE if the user is asking or looking for a property/flat/house/listing, BUT NO city is mentioned AND NO Active City is present.
   - If an Active City is already present, missingCity is FALSE.
3. 'reset':
   - If the user says "clear filters", "reset filters", "show all properties", reset petFriendly, bedrooms, price to null, while keeping the city.
4. 'petFriendly':
   - Set to true if the user mentions pets, pet-friendly, dogs, cats, animals allowed.
   - Set to null if the user says "any pets", "remove pet filter", or "doesn't matter".
   - If not mentioned in latest utterance, retain the Active Pet-Friendly Filter from context.
5. 'bedrooms':
   - Extract number of bedrooms if specified in latest speech (e.g. "3 BHK" -> 3, "2 bedroom" -> 2), replacing any previous bedroom filter.
   - If not mentioned in latest utterance, retain Active Bedrooms.
6. 'listingType': "rent" or "sale" if specified; otherwise retain Active Listing Type.
7. 'minPrice' & 'maxPrice': Numerical values if a budget is mentioned; otherwise retain active price.
8. 'keywords': Array of other key traits (e.g., ["near metro", "parking", "furnished"]).
9. 'summary': A short natural description (e.g. "Pet-friendly 3 BHK homes in Faridabad").

RECENT CONVERSATION HISTORY:
${historyFormatted || "None"}

LATEST USER UTTERANCE:
"${userSpeech}"
`.trim();

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            city: { type: "string", nullable: true },
            missingCity: { type: "boolean" },
            petFriendly: { type: "boolean", nullable: true },
            bedrooms: { type: "number", nullable: true },
            minPrice: { type: "number", nullable: true },
            maxPrice: { type: "number", nullable: true },
            listingType: { type: "string", enum: ["rent", "sale"], nullable: true },
            propertyType: { type: "string", nullable: true },
            keywords: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["city", "missingCity", "summary"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      city: parsed.city ? parsed.city.trim() : (activeCriteria?.city || null),
      missingCity: Boolean(parsed.missingCity),
      petFriendly: parsed.petFriendly ?? (activeCriteria?.petFriendly ?? null),
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : (activeCriteria?.bedrooms ?? null),
      minPrice: typeof parsed.minPrice === "number" ? parsed.minPrice : (activeCriteria?.minPrice ?? null),
      maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : (activeCriteria?.maxPrice ?? null),
      listingType: parsed.listingType === "rent" || parsed.listingType === "sale" ? parsed.listingType : (activeCriteria?.listingType ?? null),
      propertyType: parsed.propertyType || (activeCriteria?.propertyType ?? null),
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : (activeCriteria?.keywords || []),
      summary: parsed.summary || "Property search query",
    };
  } catch (err) {
    console.warn("[SalesSearchAgent] Gemini refactoring fallback triggered:", err);
    return fallbackExtractCriteria(userSpeech, historyFormatted, activeCriteria);
  }
}
