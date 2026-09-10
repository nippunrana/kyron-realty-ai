import type { HyperLocalKbData } from "@/db/schema";
import type { GeminiUsage } from "../gemini";

export interface HyperLocalEnrichmentInput {
  address: string;
  city?: string;
  state?: string;
}

export interface MapsUsageTelemetry {
  groundingQueries: number;
  routeMatrixCalls: number;
  routeMatrixElements: number;
  freeTierQuota: string;
}

export interface HyperLocalEnrichmentResult {
  kbData: HyperLocalKbData;
  modelUsed: string;
  /** False when the Maps tool did not fire, i.e. the content is unverified model recall. */
  grounded: boolean;
  mapsQueryCount: number;
  /** False when Routes API was unconfigured or unreachable; distances are then absent. */
  distancesMeasured: boolean;
  mapsUsage?: MapsUsageTelemetry;
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
