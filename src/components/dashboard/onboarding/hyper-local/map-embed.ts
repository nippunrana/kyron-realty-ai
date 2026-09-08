import type { NearbyPlaceDistance } from "@/db/schema";

/**
 * Maps Embed API is free with unlimited usage, unlike the metered Routes API that measured
 * the distances. It needs its own browser key: this one is inlined into the page at build
 * time and is publicly visible, so it must be referrer-restricted and must never be the
 * server-side Routes key. Absent key = the whole map affordance is hidden by the callers.
 */
export function getMapEmbedKey(): string {
  // Referenced literally so `next build` can inline it; a dynamic lookup would not be replaced.
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || "").trim();
}

/**
 * The origin string every map surface geocodes against. Shared so the inline map, the map
 * modal and the keyless links cannot drift onto slightly different addresses and quietly
 * resolve to different buildings.
 */
export function buildMapOrigin(propertyAddress: string, city?: string): string {
  return [propertyAddress, city, "India"].filter(Boolean).join(", ");
}

interface EmbedSrcOptions {
  key: string;
  origin: string;
  /** The place to route to, or null for a plain pin on the property. */
  place?: Pick<NearbyPlaceDistance, "name" | "placeId"> | null;
  mode: "walk" | "drive";
  city?: string;
}

/**
 * One iframe URL. Directions mode when a place is chosen (it draws the route and labels
 * distance and time), otherwise a plain pin on the property.
 */
export function buildEmbedSrc({ key, origin, place, mode, city }: EmbedSrcOptions): string {
  if (!place) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(origin)}`;
  }
  return (
    `https://www.google.com/maps/embed/v1/directions?key=${key}` +
    `&origin=${encodeURIComponent(origin)}` +
    // placeId is exact; the name is a fallback for a place that never carried one.
    `&destination=${encodeURIComponent(
      place.placeId ? `place_id:${place.placeId}` : `${place.name}, ${city || ""}`
    )}` +
    `&mode=${mode === "walk" ? "walking" : "driving"}`
  );
}
