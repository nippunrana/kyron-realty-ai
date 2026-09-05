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
Your job is to analyze the recent conversation turns between Elena Vance (AI Real Estate Specialist) and the property owner, and extract or update any of the Core or Additional property specifications:

1. CORE SPECS (Stage 1):
- listingType: "rent" or "sale"
- price: target price or monthly rent number (e.g. 3500)
- bedrooms: bedroom count number (e.g. 2, 0 for studio)
- bathrooms: bathroom count number (e.g. 1.5, 2)
- sqft: interior square footage number (e.g. 1200)
- address: street address (e.g. "250 Marina Blvd")
Optional location fields: city, state, zipCode.
- contactEmail: verified public contact email for listing (e.g. "alex@example.com") if the owner confirms or provides an email.

2. ADDITIONAL SPECS & KNOWLEDGE BASE (Stage 2):
- parkingDetail: parking arrangement (e.g. "2-car garage included", "1 assigned stall", "Street parking only", "No parking")
- petPolicyDetail: for rentals only (e.g. "Cats and dogs allowed with deposit", "Cats only", "No pets allowed")
- utilitiesDetail: utilities included vs tenant responsibility (e.g. "Water and trash included", "Tenant pays electric and gas", "All utilities included")
- hoaFeeMonthly: monthly HOA / condo dues dollar amount (e.g. 350)
- securityDeposit: security deposit dollar amount (e.g. 2500)
- minLeaseMonths: minimum lease duration in months (e.g. 12, 6)
- availableDate: move-in availability date or timing (e.g. "Immediate", "Available in 30 days", "October 1st")
- features: notable features mentioned (e.g. "Central A/C", "In-unit washer/dryer", "Private balcony", "Newly renovated kitchen", "Vacant and move-in ready")
- amenities: building amenities mentioned (e.g. "Pool", "Fitness center", "Elevator", "Doorman")

CRITICAL INSTRUCTIONS FOR DIALOGUE REASONING & ASR ROBUSTNESS:
- Dialogue is labeled with [ELENA VANCE] and [OWNER].
- Automatic Speech Recognition (ASR) phonetic slips: Spoken owner words may be transcribed with slight errors (e.g. "It's Oren" instead of "It's for rent"). Use Elena's subsequent confirmations and preceding questions as context to disambiguate the owner's true intent.
- Extract facts EXCLUSIVELY from what the owner states or agrees to. Never treat Elena's hypothetical examples as facts.
- If no property specs were mentioned or changed in this dialogue, return an empty "updates" object: { "updates": {} }.

UI MODAL INTENT DETECTION:
- "open_core" (or "open"): Elena or owner is EXPLICITLY announcing, showing, pulling up, or opening the Core Specs review card (e.g. Elena says "I've pulled up your core specs review card on your screen", or owner asks "open the review card" / "show me the card").
  CRITICAL: If the owner or Elena is simply asking or answering regular property intake questions (such as stating "for rent", giving an address, stating a price, bedrooms, bathrooms, or sqft), modalAction MUST BE "none". NEVER return "open_core" during intake answers!
- "close_core" (or "close"): The owner confirms or approves the core specs (e.g. "looks good", "this all looks good", "we can proceed further", "let's proceed", "confirmed", "that's right", "continue", "let's move on") or explicitly asks to close/minimize the review card.
- "open_final": Elena or owner is pulling up the Final Complete / Deploy review card.
- "close_final": Owner asks to close or minimize the final review card.
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
          required: ["updates", "modalAction"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      updates: parsed.updates || {},
      modalAction: parsed.modalAction || "none",
    };
  } catch (err: any) {
    console.error("[Turn Extraction Error]:", err.message || err);
    return { updates: {}, modalAction: "none" };
  }
}

