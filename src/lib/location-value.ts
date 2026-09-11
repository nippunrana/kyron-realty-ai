/**
 * What is this address actually worth, measured rather than asserted?
 *
 * A caller who says the rent is too high is asking a real question, and the honest answer is
 * usually about the location: a metro, a school and a hospital all inside a short walk are
 * effort and travel they would otherwise spend every day. But "this is a prime area" is a
 * claim, and a voice agent left to infer it from a list of place names will produce it for a
 * home with one clinic and a tuition centre. So the inference happens here, in code, against
 * thresholds - exactly the way `property-fit.ts` computes the budget verdict - and Sarah
 * receives the result as a fact she may state, alongside an explicit list of what she may not.
 *
 * Pure and dependency-free so `node --test` can import it directly.
 */

/** Anything further than this on foot is not something a caller experiences as "walkable". */
const CLOSE_WALK_MINUTES = 15;
/** The drive equivalent, for the places nobody walks to. */
const CLOSE_DRIVE_MINUTES = 10;
/** "Several schools" means a real choice between them. The enricher searches once per
 *  category and returns a handful, so two is genuine plurality here, not a weak bar. */
const SEVERAL = 2;

export type PlaceCategory = "transit" | "school" | "hospital";

/** One nearby place with travel times measured by the Routes API. Never model estimates. */
export interface MeasuredPlace {
  name: string;
  category: PlaceCategory;
  walkSeconds?: number;
  driveSeconds?: number;
}

/** The places we know only by name, used when the Routes API never ran for this listing. */
export interface NamedPlaces {
  transit: string[];
  school: string[];
  hospital: string[];
}

export interface LocationInput {
  measured: MeasuredPlace[];
  named: NamedPlaces;
}

export interface CategoryPresence {
  category: PlaceCategory;
  /** How many places of this category we know about. */
  count: number;
  /** How many of them are close enough to matter. Always 0 on the `named` tier. */
  closeCount: number;
  /** The shortest measured walk, in whole minutes. Null when nothing was measured. */
  bestWalkMinutes: number | null;
  /** The shortest measured drive, in whole minutes. Null when nothing was measured. */
  bestDriveMinutes: number | null;
}

export type LocationTier =
  /** Real travel times exist. The density verdict below is allowed to mean something. */
  | "measured"
  /** Places are known by name only. They may be mentioned; nothing may be said about distance. */
  | "named"
  /** We know nothing about this neighbourhood. Sarah sells the home and not the address. */
  | "none";

export interface LocationValue {
  tier: LocationTier;
  /** Categories we know at least one place in, transit first. */
  categories: CategoryPresence[];
  /**
   * True only when measured times prove several kinds of everyday service sit within reach.
   * This is the single fact that licenses Sarah to call the location well-served.
   */
  serviceDense: boolean;
  /** The line Sarah may build a location argument on, or null when there is nothing to say. */
  summary: string | null;
}

const CATEGORY_ORDER: PlaceCategory[] = ["transit", "school", "hospital"];

const CATEGORY_NOUN: Record<PlaceCategory, { one: string; many: string }> = {
  transit: { one: "transit stop", many: "transit stops" },
  school: { one: "school", many: "schools" },
  hospital: { one: "hospital", many: "hospitals" },
};

function toMinutes(seconds?: number): number | null {
  if (!seconds || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds / 60));
}

/** The lowest of a set of measured minutes, or null when none of them were measured. */
function best(values: Array<number | null>): number | null {
  const real = values.filter((v): v is number => v !== null);
  return real.length ? Math.min(...real) : null;
}

/** Close enough that a caller would count it as part of living here. */
function isClose(place: MeasuredPlace): boolean {
  const walk = toMinutes(place.walkSeconds);
  const drive = toMinutes(place.driveSeconds);
  return (walk !== null && walk <= CLOSE_WALK_MINUTES) || (drive !== null && drive <= CLOSE_DRIVE_MINUTES);
}

function countNoun(category: PlaceCategory, count: number): string {
  const noun = CATEGORY_NOUN[category];
  return `${count} ${count === 1 ? noun.one : noun.many}`;
}

function measuredPresence(places: MeasuredPlace[], category: PlaceCategory): CategoryPresence | null {
  const mine = places.filter((p) => p.category === category);
  if (!mine.length) return null;
  const close = mine.filter(isClose);
  return {
    category,
    count: mine.length,
    closeCount: close.length,
    bestWalkMinutes: best(mine.map((p) => toMinutes(p.walkSeconds))),
    bestDriveMinutes: best(mine.map((p) => toMinutes(p.driveSeconds))),
  };
}

function namedPresence(named: NamedPlaces, category: PlaceCategory): CategoryPresence | null {
  const count = named[category].filter((n) => n && n.trim()).length;
  if (!count) return null;
  return { category, count, closeCount: 0, bestWalkMinutes: null, bestDriveMinutes: null };
}

/**
 * The density gate.
 *
 * Two ways to clear it, and both describe somewhere a person would recognise as well-served:
 * all three kinds of everyday service reachable, or two kinds where one of them offers a real
 * choice. Anything thinner is a home with some amenities near it, which is not a claim about
 * the neighbourhood and must not be dressed up as one.
 */
function isServiceDense(categories: CategoryPresence[]): boolean {
  const served = categories.filter((c) => c.closeCount > 0);
  if (served.length >= CATEGORY_ORDER.length) return true;
  return served.length >= 2 && served.some((c) => c.closeCount >= SEVERAL);
}

function describeMeasured(presence: CategoryPresence): string {
  const reach =
    presence.bestWalkMinutes !== null && presence.bestWalkMinutes <= CLOSE_WALK_MINUTES
      ? `nearest ${presence.bestWalkMinutes} min walk`
      : presence.bestDriveMinutes !== null
        ? `nearest ${presence.bestDriveMinutes} min drive`
        : "no close travel time measured";
  return `${countNoun(presence.category, presence.count)} (${reach})`;
}

function buildSummary(tier: LocationTier, categories: CategoryPresence[], serviceDense: boolean): string | null {
  if (tier === "none") return null;

  if (tier === "named") {
    const listed = categories.map((c) => countNoun(c.category, c.count)).join(", ");
    return `${listed} are named near this home, but nothing was ever measured. You may say they are in the area. You may NOT say how far any of them is, how long it takes to reach, or anything at all about how central or well-connected this location is.`;
  }

  const listed = categories.map(describeMeasured).join("; ");

  if (serviceDense) {
    return `${listed}. That is enough measured everyday service around this address to call it a well-served, established pocket, and you may say so in those terms - always with one of the measured numbers above attached.`;
  }

  return `${listed}. This is NOT enough to make any claim about the neighbourhood as a whole. Quote these individual numbers where they help and say nothing about the area being central, well-served or established.`;
}

/**
 * The location verdict for one home. `measured` wins whenever any real travel time exists;
 * the named lists are a fallback for listings enriched before distances were measured, never
 * a top-up for a thin measured set.
 */
export function summariseLocationValue(input: LocationInput): LocationValue {
  const measured = input.measured.filter((p) => toMinutes(p.walkSeconds) !== null || toMinutes(p.driveSeconds) !== null);

  if (measured.length) {
    const categories = CATEGORY_ORDER.map((c) => measuredPresence(measured, c)).filter(
      (c): c is CategoryPresence => c !== null
    );
    const serviceDense = isServiceDense(categories);
    return { tier: "measured", categories, serviceDense, summary: buildSummary("measured", categories, serviceDense) };
  }

  const categories = CATEGORY_ORDER.map((c) => namedPresence(input.named, c)).filter(
    (c): c is CategoryPresence => c !== null
  );

  if (!categories.length) {
    return { tier: "none", categories: [], serviceDense: false, summary: null };
  }

  return { tier: "named", categories, serviceDense: false, summary: buildSummary("named", categories, false) };
}

/** No neighbourhood data at all, which is where a listing with no enrichment starts. */
export function emptyLocationValue(): LocationValue {
  return { tier: "none", categories: [], serviceDense: false, summary: null };
}
