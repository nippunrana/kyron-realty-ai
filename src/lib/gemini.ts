/**
 * The Gemini API key, read once for the synthesizer, the turn extractor, and the
 * voice agent's LLM brain. Accepts the three env names deployments have used, in
 * this precedence; returns an empty string when none is set.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  ).trim();
}

export interface GeminiUsage {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  costUsd: number;
  costFormatted: string;
}

const MODEL_PRICING: Record<string, { inputRatePer1M: number; outputRatePer1M: number }> = {
  "gemini-3.8-flash": { inputRatePer1M: 0.30, outputRatePer1M: 2.50 },
  "gemini-3.5-flash-lite": { inputRatePer1M: 0.30, outputRatePer1M: 2.50 },
  "gemini-3.1-flash-lite": { inputRatePer1M: 0.25, outputRatePer1M: 1.50 },
  "gemini-2.5-flash": { inputRatePer1M: 0.30, outputRatePer1M: 2.50 },
  "gemini-2.5-flash-lite": { inputRatePer1M: 0.10, outputRatePer1M: 0.40 },
  "gemini-2.0-flash-lite": { inputRatePer1M: 0.075, outputRatePer1M: 0.30 },
  "gemini-2.0-flash": { inputRatePer1M: 0.10, outputRatePer1M: 0.40 },
  "gemini-1.5-flash": { inputRatePer1M: 0.075, outputRatePer1M: 0.30 },
};

/**
 * Calculates exact Gemini API call cost based on token counts and official model pricing.
 * Official Google Developer / AI Studio rates (per 1,000,000 tokens):
 * - gemini-3.5-flash-lite: $0.30 / 1M prompt, $2.50 / 1M output
 * - gemini-2.5-flash-lite: $0.10 / 1M prompt, $0.40 / 1M output
 * - gemini-2.5-flash:      $0.30 / 1M prompt, $2.50 / 1M output
 */
export function computeGeminiCost(
  modelName: string,
  promptTokens: number,
  candidateTokens: number
): GeminiUsage {
  const normalized = modelName.toLowerCase().replace(/^models\//, "").trim();

  let rates = MODEL_PRICING[normalized];
  if (!rates) {
    if (normalized.includes("3.5-flash-lite")) {
      rates = MODEL_PRICING["gemini-3.5-flash-lite"];
    } else if (normalized.includes("2.5-flash-lite")) {
      rates = MODEL_PRICING["gemini-2.5-flash-lite"];
    } else if (normalized.includes("2.5-flash")) {
      rates = MODEL_PRICING["gemini-2.5-flash"];
    } else if (normalized.includes("lite")) {
      rates = { inputRatePer1M: 0.10, outputRatePer1M: 0.40 };
    } else {
      rates = { inputRatePer1M: 0.30, outputRatePer1M: 2.50 };
    }
  }

  const inputCost = (promptTokens / 1_000_000) * rates.inputRatePer1M;
  const outputCost = (candidateTokens / 1_000_000) * rates.outputRatePer1M;
  const costUsd = Number((inputCost + outputCost).toFixed(6));
  const totalTokens = promptTokens + candidateTokens;

  return {
    promptTokens,
    candidateTokens,
    totalTokens,
    costUsd,
    costFormatted: `$${costUsd.toFixed(5)}`,
  };
}
