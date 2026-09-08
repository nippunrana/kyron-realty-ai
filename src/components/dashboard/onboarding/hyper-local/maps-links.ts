import type { NearbyPlaceDistance } from "@/db/schema";

/**
 * Google Maps URLs - plain links that need NO API key, no quota and no billing.
 *
 * This is the keyless counterpart to the embedded map: it opens real Google Maps in a new
 * tab (or the Maps app on mobile, where the owner can actually navigate). Because it carries
 * no key it works on every deployment, including ones with no embed key configured at all.
 */

/** Directions to one measured place, with the travel mode preselected. */
export function buildDirectionsUrl(
  origin: string,
  place: Pick<NearbyPlaceDistance, "name" | "placeId">,
  mode: "walk" | "drive"
): string {
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: place.name,
    travelmode: mode === "walk" ? "walking" : "driving",
  });
  // Pins the destination to the exact place rather than letting Maps re-search the name.
  if (place.placeId) params.set("destination_place_id", place.placeId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** The property itself, dropped as a search pin. */
export function buildPlaceUrl(origin: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({
    api: "1",
    query: origin,
  }).toString()}`;
}
