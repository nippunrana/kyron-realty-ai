import { GoogleGenAI } from "@google/genai";
import type { ExtractedPropertyPayload } from "./kb-extractor";
import { getGeminiApiKey, computeGeminiCost, type GeminiUsage } from "./gemini";

export interface TurnMessage {
  role: "assistant" | "user";
  text: string;
}

export interface PillLabels {
  parking?: string;
  pets?: string;
  utilities?: string;
  availableDate?: string;
  hoa?: string;
}

export interface ExtractTurnInput {
  slidingWindowMessages: TurnMessage[];
  currentPropertyState?: Partial<ExtractedPropertyPayload["property"]>;
  currentKnowledgeBase?: Partial<ExtractedPropertyPayload["knowledgeBase"]>;
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
  pillLabels?: PillLabels;
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
  usage?: GeminiUsage;
}> {
  const { slidingWindowMessages, currentPropertyState, currentKnowledgeBase } = input;

  if (!slidingWindowMessages || slidingWindowMessages.length === 0) {
    return { updates: {}, modalAction: "none" };
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn("[Turn Extraction] Missing GEMINI_API_KEY in environment.");
    return { updates: {}, modalAction: "none" };
  }

  const formattedDialogue = slidingWindowMessages
    .map((m) => `[${m.role === "assistant" ? "ELENA VANCE" : "OWNER"}]: ${m.text}`)
    .join("\n");

  const currentVerifiedSummary = `
CURRENT VERIFIED STATE:
- listingType: ${currentPropertyState?.listingType || "pending"}
- address: ${currentPropertyState?.address || "pending"}
- price: ${currentPropertyState?.price ? `$${currentPropertyState.price}` : "pending"}
- bedrooms: ${currentPropertyState?.bedrooms !== undefined && currentPropertyState?.bedrooms !== null ? currentPropertyState.bedrooms : "pending"}
- bathrooms: ${currentPropertyState?.bathrooms !== undefined && currentPropertyState?.bathrooms !== null ? currentPropertyState.bathrooms : "pending"}
- sqft: ${currentPropertyState?.sqft ? `${currentPropertyState.sqft} sqft` : "pending"}
- hoaFeeMonthly: ${currentPropertyState?.hoaFeeMonthly ? `$${currentPropertyState.hoaFeeMonthly}/mo` : "0"}
- securityDeposit: ${currentPropertyState?.securityDeposit ? `$${currentPropertyState.securityDeposit}` : "0"}
- availableDate: ${currentPropertyState?.availableDate || "pending"}
- parkingDetail: ${currentKnowledgeBase?.parkingDetail || "pending"}
- petPolicyDetail: ${currentKnowledgeBase?.petPolicyDetail || "pending"}
- utilitiesDetail: ${currentKnowledgeBase?.utilitiesDetail || "pending"}
- contactEmail: ${currentKnowledgeBase?.contactEmail || "pending"}
`.trim();

  const prompt = `
You are the Real Estate Turn Extractor for Kyron Realty AI.
Your job is to analyze the recent conversation turns between Elena Vance (AI Real Estate Specialist) and the property owner, and extract or update all property specifications into structured JSON:

MANDATORY EXTRACTION WORKFLOW:
1. First, summarize all spoken facts, numbers, and agreed details in 'spokenSummary' (e.g. "rent 25000, 4 bedrooms, 3 bathrooms, 3000 sqft, 41 Sector 64 Noida UP, 3 parking spaces, dogs allowed, water included, move in 15 days"). This ensures full attention across all clauses.
2. Evaluate 'coreSpecs':
   - listingType: "rent" or "sale" (or null if unknown).
     CRITICAL POLICY: If listingType in CURRENT VERIFIED STATE is already "rent" or "sale", it is PERMANENTLY LOCKED and cannot be changed!
   - price: numerical monthly rent or purchase price (e.g. 25000, or null)
   - bedrooms: number of bedrooms (e.g. 4, 0 for studio, or null)
   - bathrooms: number of full/half bathrooms (e.g. 3, 1.5, or null)
   - sqft: interior square footage (e.g. 3000, or null)
   - address: street address (e.g. "41 Sector 64", or null)
   - city: city name (e.g. "Noida", or null)
   - state: state name (e.g. "Uttar Pradesh", or null)
   - zipCode: postal code (or null)
   CRITICAL: If the owner stated multiple specs in one sentence (e.g. "rent of 25,000, 4 bedrooms, 3 bathrooms, 3,000 sqft"), you MUST populate price: 25000, bedrooms: 4, bathrooms: 3, and sqft: 3000.
3. CONTINUOUS VERBAL CORRECTIONS:
   If the owner updates or corrects ANY earlier spec (e.g. "Actually rent is 45000", "There are 3 parking spots instead of 2", "Only cats allowed", "Change address to Main Mathura Road"), ALWAYS output the owner's latest corrected value so the system updates immediately.
4. ADDITIONAL SPECS & RELATIVE TIMINGS:
   - parkingDetail: full details of parking (e.g. "3-car parking with 2 in garage and space outside").
   - petPolicyDetail: full pet policy stated (e.g. "Dogs are allowed, no issue").
   - utilitiesDetail: utility inclusions (e.g. "Water is included in maintenance fees").
   - availableDate: move-in timing or availability. If the owner specifies a relative date or timeline (e.g. "14 days from now", "in 14 days", "within two weeks", "ready in 15 days", "available immediately", "1st of next month"), ALWAYS format it cleanly as e.g. "In 14 Days", "Within 14 Days", "Available Immediately", or "1st of Next Month". NEVER leave availableDate null if move-in timing was discussed!
   - features: array of concise feature highlight strings (e.g. "1-Car Garage", "Street Parking", "Water Included via Maintenance", "Private Balcony", "Central A/C"). When parking breakdown (garage vs street), utility inclusions, or specific unit perks are discussed, extract 1–3 discrete highlight strings here so they appear as feature cards in the Live Property Inspector immediately!
    - PILL BUTTON LABELS: For any additional spec stated, provide a strictly concise 2–4 word UI button label (maximum 30 characters).
      NEVER output repetitive text, translations, loops, or commentary.
      - parkingPillText: e.g. "3-Car Parking"
      - petPolicyPillText: e.g. "Dogs Allowed"
      - utilitiesPillText: e.g. "Water Included"
      - availableDatePillText: e.g. "In 14 Days"
      - hoaPillText: e.g. "$250/mo HOA" or "No HOA"
5. Determine 'modalAction':
   - "open_core": Elena or owner EXPLICITLY announces, pulls up, or asks to show the Core Specs review card (e.g. "I've pulled up your core specs review card on your screen", "open the review card", "show me the card").
     CRITICAL: If the owner or Elena is simply asking or answering regular intake questions, modalAction MUST BE "none".
   - "close_core": Owner confirms or approves the core specs (e.g. "looks good", "proceed", "confirmed", "that's right", "continue") or asks to close/minimize the review card.
   - "open_final": Elena or owner announces/opens the full specs review card or final review card (e.g. "I've pulled up your full property review card", "open review card").
   - "close_final": Owner confirms or approves the full review card, or says "All is done", "all done", "everything is done", "all set", "looks good", "proceed", or asks to close/minimize the card to move to photo upload.
   - CRITICAL SAFEGUARD: If the owner is adjusting, changing, or correcting any detail (e.g. "Actually change price to 3500", "make it 2 parking spots"), modalAction MUST BE "none" so the review card remains open on screen while values update live.
   - Otherwise: "none".

${currentVerifiedSummary}

RECENT DIALOGUE (Sliding Window):
${formattedDialogue}
`.trim();

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        maxOutputTokens: 800,
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
                parkingPillText: { type: "string", description: "Concise 2-4 word pill button text (e.g. '3-Car Parking')" },
                petPolicyDetail: { type: "string" },
                petPolicyPillText: { type: "string", description: "Concise 2-4 word pill button text (e.g. 'Dogs Allowed')" },
                utilitiesDetail: { type: "string" },
                utilitiesPillText: { type: "string", description: "Concise 2-4 word pill button text (e.g. 'Water Included')" },
                hoaFeeMonthly: { type: "number" },
                hoaPillText: { type: "string", description: "Concise 2-4 word pill button text (e.g. 'No HOA' or '$250/mo HOA')" },
                securityDeposit: { type: "number" },
                minLeaseMonths: { type: "number" },
                availableDate: { type: "string" },
                availableDatePillText: { type: "string", description: "Concise 2-4 word pill button text (e.g. 'In 15 Days')" },
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

    // ListingType lock policy: cannot change if already locked in current state
    const lockedListingType = currentPropertyState?.listingType;
    if (lockedListingType === "rent" || lockedListingType === "sale") {
      updates.listingType = lockedListingType;
    } else if (rawCore.listingType === "rent" || rawCore.listingType === "sale") {
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

    // Dynamic Pill Labels with strict character length guard (prevents loop glitches)
    const cleanPillString = (val: any) => {
      const s = cleanString(val);
      if (!s) return undefined;
      return s.length > 35 ? s.slice(0, 32) + "..." : s;
    };

    const pillLabels: PillLabels = {};
    const cleanParkingPill = cleanPillString(rawAdditional.parkingPillText);
    if (cleanParkingPill) pillLabels.parking = cleanParkingPill;
    const cleanPetPill = cleanPillString(rawAdditional.petPolicyPillText);
    if (cleanPetPill) pillLabels.pets = cleanPetPill;
    const cleanUtilPill = cleanPillString(rawAdditional.utilitiesPillText);
    if (cleanUtilPill) pillLabels.utilities = cleanUtilPill;
    const cleanAvailPill = cleanPillString(rawAdditional.availableDatePillText);
    if (cleanAvailPill) pillLabels.availableDate = cleanAvailPill;
    const cleanHoaPill = cleanPillString(rawAdditional.hoaPillText);
    if (cleanHoaPill) pillLabels.hoa = cleanHoaPill;

    if (Object.keys(pillLabels).length > 0) {
      updates.pillLabels = pillLabels;
    }

    const durationMs = Date.now() - startTime;
    const promptTokens = response.usageMetadata?.promptTokenCount || 0;
    const candidateTokens = response.usageMetadata?.candidatesTokenCount || 0;
    const usage = computeGeminiCost(modelName, promptTokens, candidateTokens);

    console.log(
      `[Turn Extractor] Completed in ${durationMs}ms (${usage.totalTokens} tokens, ${usage.costFormatted}):`,
      JSON.stringify({
        updatedFields: Object.keys(updates),
        availableDate: updates.availableDate,
        features: updates.features,
        pillLabels: updates.pillLabels,
        modalAction: parsed.modalAction || "none",
        usage,
      })
    );

    return {
      updates,
      modalAction: parsed.modalAction || "none",
      usage,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[Turn Extractor Error] Failed after ${durationMs}ms:`, err.message || err);
    return { updates: {}, modalAction: "none" };
  }
}

