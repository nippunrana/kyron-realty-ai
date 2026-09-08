import type { HyperLocalKbData } from "@/db/schema";
import type { GeminiUsage } from "../gemini";

export interface HyperLocalEnrichmentInput {
  address: string;
  city?: string;
  state?: string;
  price?: number;
  listingType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  propertyType?: string;
}

export interface HyperLocalEnrichmentResult {
  kbData: HyperLocalKbData;
  /**
   * Retained so the studio and publish payload keep compiling. The buyer agent's script is
   * no longer compiled here: onboarding researches the area, it does not author Sarah's prompt.
   * An empty value makes `agora-agent-client` assemble the prompt from the knowledge base row.
   */
  eaScript: string;
  modelUsed: string;
  /** False when the Maps tool did not fire, i.e. the content is unverified model recall. */
  grounded: boolean;
  mapsQueryCount: number;
  /** False when Routes API was unconfigured or unreachable; distances are then absent. */
  distancesMeasured: boolean;
  usage?: GeminiUsage;
  latencyMs: number;
}

/** A place Google Maps grounding returned, carrying the placeId distances are measured against. */
export interface MapsSource {
  title: string;
  uri: string;
  placeId?: string;
}

export interface ResearchOutcome {
  text: string;
  grounded: boolean;
  queries: string[];
  sources: MapsSource[];
  promptTokens: number;
  outputTokens: number;
}
