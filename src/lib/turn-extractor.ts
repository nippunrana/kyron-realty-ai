import { GoogleGenAI } from "@google/genai";
import type { ExtractedPropertyPayload } from "./kb-extractor";

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
  contactEmail?: string;
  // Additional Specs
  parkingDetail?: string;
  petPolicyDetail?: string;
  utilitiesDetail?: string;
  hoaFeeMonthly?: number;
  securityDeposit?: number;
  minLeaseMonths?: number;
  availableDate?: string;
  features?: string[];
  amenities?: string[];
}

/**
 * Asynchronous, out-of-band turn extractor powered by Gemini 3.5 Flash-Lite.
 * Uses a sliding window of recent role-labeled turns ([ELENA VANCE] and [OWNER])
 * to repair ASR phonetic speech-to-text slips through conversational question & confirmation context.
 */
export async function extractTurnSpecs(
  input: ExtractTurnInput
): Promise<{
  updates: TurnSpecUpdates;
  modalAction?: "open_core" | "close_core" | "open_final" | "close_final" | "open" | "close" | "none";
}> {
  const { slidingWindowMessages, currentPropertyState } = input;

  if (!slidingWindowMessages || slidingWindowMessages.length === 0) {
    return { updates: {}, modalAction: "none" };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("[Turn Extraction] Missing GEMINI_API_KEY in environment.");
    return { updates: {}, modalAction: "none" };
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
- hoaFeeMonthly: ${currentPropertyState.hoaFeeMonthly ? `$${currentPropertyState.hoaFeeMonthly}/mo` : "0"}
- securityDeposit: ${currentPropertyState.securityDeposit ? `$${currentPropertyState.securityDeposit}` : "0"}
- availableDate: ${currentPropertyState.availableDate || "pending"}
`.trim()
    : "";

  const prompt = `
You are the Real Estate Turn Extractor for Kyron Realty AI.
Your job is to analyze the recent conversation turns between Elena Vance (AI Real Estate Specialist) and the property owner, and extract or update all property specifications into structured JSON:

MANDATORY EXTRACTION WORKFLOW:
1. First, summarize all spoken facts, numbers, and agreed details in 'spokenSummary' (e.g. "rent 25000, 4 bedrooms, 3 bathrooms, 3000 sqft, 41 Sector 64 Noida UP"). This ensures full attention across all clauses.
2. Next, evaluate EVERY field in 'coreSpecs'. If a value was spoken in the dialogue or already confirmed in CURRENT VERIFIED STATE, output its number or clean string. If an attribute is completely unknown or not yet mentioned, output null.
   - listingType: "rent" or "sale" (or null)
   - price: numerical monthly rent or purchase price (e.g. 25000, or null)
   - bedrooms: number of bedrooms (e.g. 4, 0 for studio, or null)
   - bathrooms: number of full/half bathrooms (e.g. 3, 1.5, or null)
   - sqft: interior square footage (e.g. 3000, or null)
   - address: street address (e.g. "41 Sector 64", or null)
   - city: city name (e.g. "Noida", or null)
   - state: state name (e.g. "Uttar Pradesh", or null)
   - zipCode: postal code (or null)
   CRITICAL: If the owner stated multiple specs in one sentence (e.g. "rent of 25,000, 4 bedrooms, 3 bathrooms, 3,000 sqft"), you MUST populate price: 25000, bedrooms: 4, bathrooms: 3, and sqft: 3000. NEVER leave bedrooms or bathrooms as null if the owner stated them!
3. Populate any mentioned 'additionalSpecs' (parking, pets, utilities, HOA, deposit, lease length, move-in date, features, amenities, email).
4. Determine 'modalAction':
   - "open_core": Elena or owner EXPLICITLY announces, pulls up, or asks to show the Core Specs review card (e.g. "I've pulled up your core specs review card on your screen", "open the review card", "show me the card").
     CRITICAL: If the owner or Elena is simply asking or answering regular intake questions (such as stating "for rent", giving an address, stating price/beds/baths), modalAction MUST BE "none".
   - "close_core": Owner confirms or approves the core specs (e.g. "looks good", "proceed", "confirmed", "that's right", "continue") or asks to close/minimize the review card.
   - "open_final": Elena or owner announces/opens the Final Complete review card.
   - "close_final": Owner asks to close or minimize the final card.
   - Otherwise: "none".

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
            spokenSummary: {
              type: "string",
              description: "Concise scratchpad summarizing all facts and numbers spoken in this dialogue",
            },
            coreSpecs: {
              type: "object",
              description: "Core property specifications. Output the value if spoken or confirmed, or null if unknown.",
              properties: {
                listingType: { type: "string", enum: ["rent", "sale"], nullable: true },
                price: { type: "number", nullable: true },
                bedrooms: { type: "number", nullable: true },
                bathrooms: { type: "number", nullable: true },
                sqft: { type: "number", nullable: true },
                address: { type: "string", nullable: true },
                city: { type: "string", nullable: true },
                state: { type: "string", nullable: true },
                zipCode: { type: "string", nullable: true },
              },
              required: ["listingType", "price", "bedrooms", "bathrooms", "sqft", "address"],
            },
            additionalSpecs: {
              type: "object",
              properties: {
                contactEmail: { type: "string" },
                parkingDetail: { type: "string" },
                petPolicyDetail: { type: "string" },
                utilitiesDetail: { type: "string" },
                hoaFeeMonthly: { type: "number" },
                securityDeposit: { type: "number" },
                minLeaseMonths: { type: "number" },
                availableDate: { type: "string" },
                features: { type: "array", items: { type: "string" } },
                amenities: { type: "array", items: { type: "string" } },
              },
            },
            modalAction: {
              type: "string",
              enum: [
                "open_core",
                "close_core",
                "open_final",
                "close_final",
                "open",
                "close",
                "none",
              ],
            },
          },
          required: ["spokenSummary", "coreSpecs", "modalAction"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const rawCore = parsed.coreSpecs || {};
    const rawAdditional = parsed.additionalSpecs || {};

    // Filter out null, undefined, and placeholder strings
    const updates: TurnSpecUpdates = {};

    const cleanString = (val: any) => {
      if (typeof val !== "string") return undefined;
      const t = val.trim();
      if (!t || t.toLowerCase() === "null" || t.toLowerCase() === "pending" || t.toLowerCase() === "undefined" || t.toLowerCase() === "n/a") {
        return undefined;
      }
      return t;
    };

    if (rawCore.listingType === "rent" || rawCore.listingType === "sale") {
      updates.listingType = rawCore.listingType;
    }
    if (typeof rawCore.price === "number" && !isNaN(rawCore.price) && rawCore.price > 0) {
      updates.price = rawCore.price;
    }
    if (typeof rawCore.bedrooms === "number" && !isNaN(rawCore.bedrooms) && rawCore.bedrooms >= 0) {
      updates.bedrooms = rawCore.bedrooms;
    }
    if (typeof rawCore.bathrooms === "number" && !isNaN(rawCore.bathrooms) && rawCore.bathrooms > 0) {
      updates.bathrooms = rawCore.bathrooms;
    }
    if (typeof rawCore.sqft === "number" && !isNaN(rawCore.sqft) && rawCore.sqft > 0) {
      updates.sqft = rawCore.sqft;
    }
    const cleanAddr = cleanString(rawCore.address);
    if (cleanAddr) updates.address = cleanAddr;
    const cleanCity = cleanString(rawCore.city);
    if (cleanCity) updates.city = cleanCity;
    const cleanState = cleanString(rawCore.state);
    if (cleanState) updates.state = cleanState;
    const cleanZip = cleanString(rawCore.zipCode);
    if (cleanZip) updates.zipCode = cleanZip;

    // Additional specs
    const cleanEmail = cleanString(rawAdditional.contactEmail);
    if (cleanEmail) updates.contactEmail = cleanEmail;
    const cleanParking = cleanString(rawAdditional.parkingDetail);
    if (cleanParking) updates.parkingDetail = cleanParking;
    const cleanPets = cleanString(rawAdditional.petPolicyDetail);
    if (cleanPets) updates.petPolicyDetail = cleanPets;
    const cleanUtils = cleanString(rawAdditional.utilitiesDetail);
    if (cleanUtils) updates.utilitiesDetail = cleanUtils;
    if (typeof rawAdditional.hoaFeeMonthly === "number" && !isNaN(rawAdditional.hoaFeeMonthly)) {
      updates.hoaFeeMonthly = rawAdditional.hoaFeeMonthly;
    }
    if (typeof rawAdditional.securityDeposit === "number" && !isNaN(rawAdditional.securityDeposit)) {
      updates.securityDeposit = rawAdditional.securityDeposit;
    }
    if (typeof rawAdditional.minLeaseMonths === "number" && !isNaN(rawAdditional.minLeaseMonths)) {
      updates.minLeaseMonths = rawAdditional.minLeaseMonths;
    }
    const cleanAvail = cleanString(rawAdditional.availableDate);
    if (cleanAvail) updates.availableDate = cleanAvail;
    if (Array.isArray(rawAdditional.features) && rawAdditional.features.length > 0) {
      updates.features = rawAdditional.features.filter((f: any) => typeof f === "string" && f.trim());
    }
    if (Array.isArray(rawAdditional.amenities) && rawAdditional.amenities.length > 0) {
      updates.amenities = rawAdditional.amenities.filter((a: any) => typeof a === "string" && a.trim());
    }

    return {
      updates,
      modalAction: parsed.modalAction || "none",
    };
  } catch (err: any) {
    console.error("[Turn Extraction Error]:", err.message || err);
    return { updates: {}, modalAction: "none" };
  }
}

