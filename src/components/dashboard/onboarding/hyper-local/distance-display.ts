import type { HyperLocalKbData, NearbyPlaceDistance } from "@/db/schema";

/**
 * Below this, walking is the honest way to describe the trip. A metro station 1.4km away is
 * a 19 minute walk but a 4.3km drive around a divided carriageway - leading with the drive
 * would make it sound further than it is, and leading with a walk on a 3km school would make
 * it sound closer. One threshold, applied to the measured walking distance.
 */
const WALKABLE_METERS = 1500;

export interface DisplayDistance {
  /** e.g. "1.4 km walk · 19 min" */
  label: string;
  mode: "walk" | "drive";
}

function km(meters: number) {
  return meters < 950 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}

function mins(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 1 ? "under a min" : `${m} min`;
}

/** Returns null when the place was named but never successfully routed. */
export function formatDistance(d: NearbyPlaceDistance | undefined): DisplayDistance | null {
  if (!d) return null;

  const walkable = d.walkMeters !== undefined && d.walkMeters <= WALKABLE_METERS;
  if (walkable && d.walkMeters !== undefined) {
    const time = d.walkSeconds !== undefined ? ` · ${mins(d.walkSeconds)}` : "";
    return { label: `${km(d.walkMeters)} walk${time}`, mode: "walk" };
  }
  if (d.driveMeters !== undefined) {
    const time = d.driveSeconds !== undefined ? ` · ${mins(d.driveSeconds)}` : "";
    return { label: `${km(d.driveMeters)} drive${time}`, mode: "drive" };
  }
  // Drive failed but walk succeeded beyond the threshold: still better than showing nothing.
  if (d.walkMeters !== undefined) {
    const time = d.walkSeconds !== undefined ? ` · ${mins(d.walkSeconds)}` : "";
    return { label: `${km(d.walkMeters)} walk${time}`, mode: "walk" };
  }
  return null;
}

/**
 * Looks up a measured distance by the place name shown in the string lists.
 *
 * The string lists stay authoritative for names; `nearbyDistances` only annotates them, so a
 * name with no match simply renders without a distance.
 */
export function findDistance(
  data: HyperLocalKbData | null | undefined,
  name: string
): NearbyPlaceDistance | undefined {
  if (!data?.nearbyDistances?.length || !name) return undefined;
  const needle = name.trim().toLowerCase();
  return data.nearbyDistances.find((d) => {
    const hay = d.name.trim().toLowerCase();
    return hay === needle || hay.includes(needle) || needle.includes(hay);
  });
}
