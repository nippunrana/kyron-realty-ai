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
}

/**
 * Resilient regex-based fallback in case Gemini is unreachable or unconfigured.
 */
function fallbackExtractCriteria(text: string, historyText: string): SalesSearchCriteria {
  const combined = `${historyText} ${text}`.toLowerCase();

  // Common Indian and global cities
  const cityMatch = combined.match(/\b(faridabad|delhi|gurugram|gurgaon|noida|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata)\b/i);
  const city = cityMatch ? cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase() : null;

  const petFriendly = /\b(pet|pets|dog|dogs|cat|cats|pet-friendly|pet friendly)\b/i.test(combined);
  const isRent = /\b(rent|lease|rental|renting)\b/i.test(combined);
  const isSale = /\b(buy|purchase|sale|selling)\b/i.test(combined);
  const listingType = isRent ? "rent" : isSale ? "sale" : null;

  const bedMatch = combined.match(/(\d+)\s*(bhk|bed|bedroom|bedrooms)/i);
  const bedrooms = bedMatch ? parseInt(bedMatch[1], 10) : null;

  const isSearchIntent = /\b(property|properties|place|places|flat|flats|apartment|apartments|house|home|listing|listings|find|show|look|search|available|any)\b/i.test(combined);
  const missingCity = isSearchIntent && !city;

  return {
    city,
    petFriendly: petFriendly || null,
    bedrooms,
    minPrice: null,
    maxPrice: null,
    listingType,
    propertyType: null,
    keywords: [],
    missingCity,
    summary: city
      ? `${petFriendly ? "Pet-friendly " : ""}properties in ${city}`
      : "Property search query",
  };
}

/**
 * Refactors and structures real-time sales conversation turns into precise DB search criteria.
 */
export async function refactorSalesSearchQuery(input: SalesSearchInput): Promise<SalesSearchCriteria> {
  const { userSpeech, conversationHistory = [] } = input;
  const apiKey = getGeminiApiKey();

  const historyFormatted = conversationHistory
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n");

  if (!apiKey) {
    return fallbackExtractCriteria(userSpeech, historyFormatted);
  }

  const prompt = `
You are an intelligent real estate search intent refactoring engine for Kyron Realty AI.
Analyze the user's latest speech and recent conversation history to extract structured property search parameters.

CRITICAL RULES:
1. 'city': Extract the city name (e.g., "Faridabad", "Delhi", "Gurgaon", "Mumbai", "Bangalore").
   - Check both the latest user speech AND recent conversation history.
   - If the user previously asked for pet-friendly properties and now replied with a city like "Faridabad", city is "Faridabad".
2. 'missingCity':
   - Set to TRUE if the user is asking or looking for a property/flat/house/listing (e.g., "Is there any pet-friendly property?", "Show me 3BHK flats"), BUT NO city has been mentioned anywhere in the speech or recent history.
   - Set to FALSE if a city is present, OR if the user is not making a property search request.
3. 'petFriendly': Set to true if the user mentions pets, pet-friendly, dogs, cats, or animals allowed.
4. 'bedrooms': Number of bedrooms if specified (e.g., "3 BHK" -> 3, "2 bedroom" -> 2).
5. 'listingType': "rent" or "sale" if specified or implied.
6. 'minPrice' & 'maxPrice': Numerical values if a budget or price range is mentioned.
7. 'keywords': Array of other key traits (e.g., ["near metro", "parking", "furnished"]).
8. 'summary': A short natural description (e.g. "Pet-friendly homes in Faridabad").

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
      city: parsed.city ? parsed.city.trim() : null,
      missingCity: Boolean(parsed.missingCity),
      petFriendly: parsed.petFriendly ?? null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
      minPrice: typeof parsed.minPrice === "number" ? parsed.minPrice : null,
      maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : null,
      listingType: parsed.listingType === "rent" || parsed.listingType === "sale" ? parsed.listingType : null,
      propertyType: parsed.propertyType || null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      summary: parsed.summary || "Property search query",
    };
  } catch (err) {
    console.warn("[SalesSearchAgent] Gemini refactoring fallback triggered:", err);
    return fallbackExtractCriteria(userSpeech, historyFormatted);
  }
}
