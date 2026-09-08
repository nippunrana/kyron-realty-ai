import { GoogleGenAI } from "@google/genai";
import type { ResearchOutcome } from "./types";

/**
 * Call 1 - grounded research against Google Maps.
 *
 * Deliberately contains no JSON or schema wording: asking this call for structured output
 * makes the model answer from memory without ever invoking the tool, and the Maps tool is
 * additionally rejected outright alongside `responseMimeType: "application/json"`.
 *
 * Deliberately asks for NO distances. The Maps grounding tool returns place names, addresses
 * and placeIds but never a distance or a coordinate, so any number the model writes here is
 * invented - measured at +/-50% run to run. Distances come from `measurePlaceDistances`.
 */
export async function researchAreaWithMaps(
  ai: GoogleGenAI,
  model: string,
  fullLocation: string
): Promise<ResearchOutcome> {
  const prompt = `
Use Google Maps to research the area around this address: ${fullLocation}

Look up and report, using only real places that Google Maps returns:

- The locality, sector or neighbourhood this address resolves to.
- The nearest metro station, suburban rail station or major bus interchange:
  its name and the line it is on.
- The major highways, expressways or arterial roads that serve this location.
- Well-known schools near this address.
- Major hospitals near this address.

Report what Maps actually returns. Where Maps has no result for something, say so
plainly rather than filling it in from memory. Do not describe the specific
building at this address, its condition, its price, or its policies - you are
reporting on the area only.

Do not state how far anything is, in kilometres, minutes or any other unit, and
do not say whether something is walkable or nearby. Distances are measured
separately from a routing service. Report names and lines only.

Search once per category listed above and report from those results. Do not run
extra lookups on individual place names you notice inside reviews, addresses or
descriptions.
`.trim();

  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleMaps: {} }] },
  });

  const grounding = res.candidates?.[0]?.groundingMetadata;
  const sources = (grounding?.groundingChunks || [])
    .filter((chunk) => chunk.maps)
    .map((chunk) => ({
      // Individual reviews arrive as their own chunks titled "Review of <place>"; both the
      // suffix and that prefix are display noise once the place is the unit of attribution.
      title: (chunk.maps?.title || "")
        .replace(/ - Google Maps$/, "")
        .replace(/^Review of /, ""),
      uri: chunk.maps?.uri || "",
      placeId: chunk.maps?.placeId || undefined,
    }))
    .filter((source) => source.title && source.uri);

  // One place backs several claims and several reviews; key on placeId so it appears once.
  const deduped = Array.from(new Map(sources.map((s) => [s.placeId || s.uri, s])).values());

  return {
    text: res.text || "",
    grounded: Boolean(grounding),
    queries: grounding?.webSearchQueries || [],
    sources: deduped,
    promptTokens: res.usageMetadata?.promptTokenCount || 0,
    // Thinking tokens bill as output.
    outputTokens:
      (res.usageMetadata?.candidatesTokenCount || 0) + (res.usageMetadata?.thoughtsTokenCount || 0),
  };
}
