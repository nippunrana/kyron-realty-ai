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
