/**
 * Hyper-Local Location Intelligence (Stage 4.5 of property onboarding).
 *
 * The whole layer, so it can be found from one place:
 *
 *   Pipeline (this directory)
 *     research.ts     Call 1 - Gemini + Google Maps grounding. Names, lines, placeIds.
 *     structuring.ts  Call 2 - Gemini JSON. Categorises places, attaches + validates placeIds.
 *     distances.ts    Call 3 - Google Routes API. The only source of distances.
 *     enricher.ts     Orchestrates the three calls and assembles the result.
 *     types.ts        Input/output and intermediate shapes.
 *
 *   Persisted shape   `HyperLocalKbData` / `NearbyPlaceDistance` in `src/db/schema.ts`,
 *                     stored as JSONB in `property_knowledge_bases.kb_data`.
 *   HTTP entry point  `src/app/api/onboarding/enrich-location/route.ts`
 *   UI                `src/components/dashboard/onboarding/hyper-local/`
 *   Live corrections  `src/lib/turn-extractor.ts` patches this record mid-call.
 *   Rules             `docs/built-systems/property-onboarding-and-apify.md`
 *
 * Env: GEMINI_API_KEY (required), GOOGLE_MAPS_API_KEY (distances; absent = no distances).
 */
export { enrichPropertyLocationWithAI } from "./enricher";
export { measurePlaceDistances, getGoogleMapsApiKey } from "./distances";
export { researchAreaWithMaps } from "./research";
export { structureResearch, selectDistanceTargets, buildKbData } from "./structuring";
export type { DistanceTarget } from "./distances";
export type {
  HyperLocalEnrichmentInput,
  HyperLocalEnrichmentResult,
  MapsSource,
  ResearchOutcome,
} from "./types";
