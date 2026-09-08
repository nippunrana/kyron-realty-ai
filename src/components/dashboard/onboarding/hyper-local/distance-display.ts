import type { HyperLocalKbData, NearbyPlaceDistance } from "@/db/schema";

/**
 * At or under this, driving is absurd - nobody drives 150m - so only the walk is offered.
 */
const WALK_ONLY_MAX_METERS = 200;

/**
 * Beyond this, walking stops being a real option and offering it is noise: a 2.8km "39 min
 * walk" is not how anyone reaches a school. Only the drive is offered.
 */
const WALK_VIABLE_MAX_METERS = 1500;

export interface DistancePill {
  mode: "walk" | "drive";
  /** e.g. "670 m · 9 min" */
  label: string;
}

function km(meters: number) {
  return meters < 950 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}

function mins(seconds?: number) {
  if (seconds === undefined) return "";
  const m = Math.round(seconds / 60);
  return m < 1 ? " · under a min" : ` · ${m} min`;
}

/**
 * Turns one measured place into the pills shown beside its name.
 *
 * The walking distance is the yardstick, because it is what decides whether walking is a
 * real option at all. Between the two thresholds both modes are genuinely useful and both
 * are shown - a 1.4km metro is a 19 minute walk *or* a 10 minute drive, and which one the
 * owner cares about depends on the owner.
 */
export function distancePills(d: NearbyPlaceDistance | undefined): DistancePill[] {
  if (!d) return [];

  const walk: DistancePill | null =
    d.walkMeters !== undefined
      ? { mode: "walk", label: `${km(d.walkMeters)}${mins(d.walkSeconds)}` }
      : null;
  const drive: DistancePill | null =
    d.driveMeters !== undefined
      ? { mode: "drive", label: `${km(d.driveMeters)}${mins(d.driveSeconds)}` }
      : null;

  // Only one mode routed: show it whatever the distance, rather than nothing.
  if (!walk) return drive ? [drive] : [];
  if (!drive) return [walk];

  if (d.walkMeters! <= WALK_ONLY_MAX_METERS) return [walk];
  if (d.walkMeters! > WALK_VIABLE_MAX_METERS) return [drive];
  return [walk, drive];
}

/**
 * Looks up a measured distance by the place name shown in the string lists.
 *
 * Exact match first: containment alone would let "Life Hospital" claim the distance of a
 * genuinely different "New Life Hospital". Containment is still needed as a fallback because
 * Maps titles carry marketing suffixes ("Fortis Hospital Noida - Best Hospital in Noida").
 */
export function findDistance(
  data: HyperLocalKbData | null | undefined,
  name: string
): NearbyPlaceDistance | undefined {
  if (!data?.nearbyDistances?.length || !name) return undefined;
  const needle = name.trim().toLowerCase();
  const exact = data.nearbyDistances.find((d) => d.name.trim().toLowerCase() === needle);
  if (exact) return exact;
  return data.nearbyDistances.find((d) => {
    const hay = d.name.trim().toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });
}
