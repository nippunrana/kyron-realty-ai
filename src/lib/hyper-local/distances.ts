import type { NearbyPlaceDistance } from "@/db/schema";

const ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

/** A categorised place to measure, paired with the placeId Maps grounding returned for it. */
export interface DistanceTarget {
  placeId: string;
  name: string;
  category: NearbyPlaceDistance["category"];
}

interface MatrixRow {
  destinationIndex?: number;
  distanceMeters?: number;
  duration?: string;
  condition?: string;
  status?: { code?: number; message?: string };
}

export function getGoogleMapsApiKey(): string {
  return (process.env.GOOGLE_MAPS_API_KEY || "").trim();
}

/** Routes returns ISO-ish second strings ("599s"); anything else is treated as unmeasured. */
function parseSeconds(duration?: string): number | undefined {
  if (!duration) return undefined;
  const n = Number.parseInt(duration, 10);
  return Number.isFinite(n) ? n : undefined;
}

async function computeMatrix(
  apiKey: string,
  origin: string,
  targets: DistanceTarget[],
  travelMode: "WALK" | "DRIVE"
): Promise<Map<number, MatrixRow>> {
  const res = await fetch(ROUTE_MATRIX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // `status` is required: a per-row failure arrives as a status code with no distance,
      // and without it an unroutable row is indistinguishable from a zero-distance one.
      "X-Goog-FieldMask":
        "originIndex,destinationIndex,duration,distanceMeters,condition,status",
    },
    body: JSON.stringify({
      origins: [{ waypoint: { address: origin } }],
      destinations: targets.map((t) => ({ waypoint: { placeId: t.placeId } })),
      travelMode,
    }),
  });

  if (!res.ok) {
    throw new Error(`Routes API ${travelMode} matrix failed (${res.status}).`);
  }

  const rows: MatrixRow[] = await res.json();
  // Rows come back out of order, so they must be keyed by destinationIndex and never by
  // array position - a verified behaviour of this endpoint, not a defensive guess.
  return new Map(
    (Array.isArray(rows) ? rows : [])
      .filter((r) => typeof r.destinationIndex === "number")
      .map((r) => [r.destinationIndex as number, r])
  );
}

/**
 * Measures real walk and drive distances from the property to each categorised place.
 *
 * Both modes are fetched because neither alone is honest: a metro station 1.4km away reads
 * as a 19 minute walk but a 4.3km drive around a divided carriageway, and a school 3km out
 * is a drive whatever the metro is. Both are stored; the UI picks which to lead with.
 *
 * Fails soft in every direction. Distances are enrichment, not core onboarding data, so a
 * missing key or a dead Routes API must never take the voice call down - the caller marks
 * `distancesMeasured: false` and the UI simply shows no distances.
 */
export async function measurePlaceDistances(
  origin: string,
  targets: DistanceTarget[]
): Promise<NearbyPlaceDistance[] | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    console.warn(
      "[Hyper-Local Distances] GOOGLE_MAPS_API_KEY is missing; skipping distance measurement."
    );
    return null;
  }
  if (!targets.length) return [];

  let walk: Map<number, MatrixRow>;
  let drive: Map<number, MatrixRow>;
  try {
    [walk, drive] = await Promise.all([
      computeMatrix(apiKey, origin, targets, "WALK"),
      computeMatrix(apiKey, origin, targets, "DRIVE"),
    ]);
  } catch (err: any) {
    console.warn(`[Hyper-Local Distances] Routes API unavailable (${err?.message}).`);
    return null;
  }

  // A row carrying a status code failed to route (bad placeId, or an origin Maps could not
  // geocode); it contributes a name with no numbers rather than a fabricated distance.
  const measured = targets.map((t, i) => {
    const w = walk.get(i);
    const d = drive.get(i);
    const ok = (r?: MatrixRow) => r && !r.status?.code && r.condition === "ROUTE_EXISTS";
    return {
      placeId: t.placeId,
      name: t.name,
      category: t.category,
      walkMeters: ok(w) ? w!.distanceMeters : undefined,
      walkSeconds: ok(w) ? parseSeconds(w!.duration) : undefined,
      driveMeters: ok(d) ? d!.distanceMeters : undefined,
      driveSeconds: ok(d) ? parseSeconds(d!.duration) : undefined,
    };
  });

  // Every row failing means the origin address itself did not geocode: report none rather
  // than a list of bare names that looks like Maps simply had no data.
  const anyMeasured = measured.some((m) => m.walkMeters !== undefined || m.driveMeters !== undefined);
  if (!anyMeasured) {
    console.warn(
      `[Hyper-Local Distances] No route resolved for any destination from "${origin}"; the origin likely failed to geocode.`
    );
    return null;
  }

  return measured;
}
