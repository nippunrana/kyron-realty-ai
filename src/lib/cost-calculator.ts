/**
 * Cost calculation engine for Kyron Realty AI.
 * Single source of truth for pricing rates and per-session / aggregate commercial spend.
 *
 * Official Provider Rates (India-Based Accounts):
 * - Agora Voice AI: $0.10 / active minute (~₹8.60 / min)
 * - Gemini Grounding with Google Maps: $14.00 per 1,000 queries = $0.014 / query (~₹1.20 / query)
 * - Google Routes: Compute Route Matrix Essentials: ₹0.15 / element = $0.00175 / element
 * - Gemini 3.5 Flash-lite AI: $0.30 / 1M prompt tokens, $2.50 / 1M output tokens (~$0.000495 / turn)
 */

export const USD_TO_INR = 95.0;

export const PRICING_RATES = {
  // Agora Conversational AI Voice Engine
  AGORA_VOICE_RATE_PER_MINUTE_USD: 0.10,

  // Gemini Grounding with Google Maps (official ai.google.dev: $14/1k queries)
  MAPS_GROUNDING_RATE_PER_QUERY_USD: 0.014,

  // Google Routes: Compute Route Matrix Essentials (Google Cloud India rate: ₹0.15/elem)
  ROUTES_RATE_PER_ELEMENT_USD: 0.00175,

  // Gemini 3.5 Flash-lite token rates
  GEMINI_35_INPUT_PER_1M_USD: 0.30,
  GEMINI_35_OUTPUT_PER_1M_USD: 2.50,
  // Approximate blended cost per turn extraction (~400 prompt tokens + 150 output tokens)
  ESTIMATED_COST_PER_TURN_USD: 0.000495,
} as const;

export interface SessionCostBreakdown {
  voiceCostUsd: number;
  routesCostUsd: number;
  mapsCostUsd: number;
  aiCostUsd: number;
  totalCostUsd: number;
  voiceCostInr: number;
  routesCostInr: number;
  mapsCostInr: number;
  aiCostInr: number;
  totalCostInr: number;
}

/**
 * Calculates itemized commercial costs for a single voice session.
 */
export function calculateSessionCostBreakdown(params: {
  durationSeconds: number;
  routesElements?: number;
  groundingQueries?: number;
  callerType?: string;
}): SessionCostBreakdown {
  const {
    durationSeconds = 0,
    routesElements = 0,
    groundingQueries = 0,
  } = params;

  // 1. Agora Voice AI Cost
  const voiceMinutes = durationSeconds / 60;
  const voiceCostUsd = Number(
    (voiceMinutes * PRICING_RATES.AGORA_VOICE_RATE_PER_MINUTE_USD).toFixed(4)
  );

  // 2. Google Routes Matrix Cost
  const routesCostUsd = Number(
    (routesElements * PRICING_RATES.ROUTES_RATE_PER_ELEMENT_USD).toFixed(4)
  );

  // 3. Gemini Maps Grounding Cost
  const mapsCostUsd = Number(
    (groundingQueries * PRICING_RATES.MAPS_GROUNDING_RATE_PER_QUERY_USD).toFixed(4)
  );

  // 4. Gemini 3.5 Flash-lite AI Extraction Cost (~1 turn per 25-30 seconds of conversation)
  const estimatedTurns = Math.max(1, Math.round(durationSeconds / 28));
  const aiCostUsd = Number(
    (estimatedTurns * PRICING_RATES.ESTIMATED_COST_PER_TURN_USD).toFixed(4)
  );

  const totalCostUsd = Number(
    (voiceCostUsd + routesCostUsd + mapsCostUsd + aiCostUsd).toFixed(4)
  );

  return {
    voiceCostUsd,
    routesCostUsd,
    mapsCostUsd,
    aiCostUsd,
    totalCostUsd,
    voiceCostInr: Number((voiceCostUsd * USD_TO_INR).toFixed(2)),
    routesCostInr: Number((routesCostUsd * USD_TO_INR).toFixed(2)),
    mapsCostInr: Number((mapsCostUsd * USD_TO_INR).toFixed(2)),
    aiCostInr: Number((aiCostUsd * USD_TO_INR).toFixed(2)),
    totalCostInr: Number((totalCostUsd * USD_TO_INR).toFixed(2)),
  };
}
