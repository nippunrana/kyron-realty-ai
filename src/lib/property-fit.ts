/**
 * Does this property satisfy what the caller said they want?
 *
 * The comparison lives here, in code, and never in the voice agent's head: an LLM asked to
 * weigh "budget 45,000" against "asking 52,000, floor 48,000" will occasionally flip it, and
 * on a live sales call a flipped comparison is a promise the owner never authorised. Sarah
 * receives the verdict as a fact and sells around it.
 *
 * Pure and dependency-free so `node --test` can import it directly.
 */

/** How much below the floor price a caller can sit and still be worth inviting to a viewing. */
const BRIDGEABLE_BAND = 0.1;

export type FitSeverity =
  /** The owner has authorised room here - negotiate within the concession rules. */
  | "adjustable"
  /** Below the floor, but close enough that seeing the home in person may move them. */
  | "bridgeable"
  /** No version of this deal exists. Say so and help them look elsewhere. */
  | "hard";

export type FitVerdict = "fit" | FitSeverity;

export interface BuyerRequirements {
  city: string | null;
  budgetMax: number | null;
  bedrooms: number | null;
  petsNeeded: boolean | null;
  listingType: "rent" | "sale" | null;
  moveInTimeline: string | null;
  mustHaves: string[];
  dealBreakers: string[];
}

export interface FitProperty {
  city: string | null;
  listingType: string;
  bedrooms: number | null;
  price: number;
  /** The owner's absolute bottom. Never disclosed to the caller - it only shapes the verdict. */
  floorPrice: number;
  isPetFriendly: boolean;
  petPolicyDetail: string | null;
}

export interface FitMiss {
  requirement: string;
  severity: FitSeverity;
  /** One spoken-language sentence Sarah can build her answer on. */
  detail: string;
}

export interface FitCheckResult {
  verdict: FitVerdict;
  met: string[];
  missed: FitMiss[];
  /**
   * Requirements the caller never stated. These are what the discovery questions ask about -
   * and they are ordered so this property's own constraints come first, because the honest
   * move is to raise the thing they would be disappointed by before they trip over it.
   */
  unknown: string[];
}

/** An empty brief: every requirement unknown, which is where a cold start begins. */
export function emptyRequirements(): BuyerRequirements {
  return {
    city: null,
    budgetMax: null,
    bedrooms: null,
    petsNeeded: null,
    listingType: null,
    moveInTimeline: null,
    mustHaves: [],
    dealBreakers: [],
  };
}

const PETS_PROHIBITED = /\b(no pets?|pets? (are )?not allowed|prohibited|not permitted)\b/i;

function sameCity(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x.includes(y) || y.includes(x);
}

/**
 * Prices the gap between what the caller will pay and what the owner will accept.
 * `met` when the asking price already fits, and below that the three bands in order:
 * room the owner authorised, a gap a viewing might close, and a gap that cannot close.
 */
function checkBudget(requirements: BuyerRequirements, property: FitProperty): FitMiss | "met" | null {
  const budget = requirements.budgetMax;
  if (!budget || budget <= 0 || !property.price || property.price <= 0) return null;
  if (property.price <= budget) return "met";

  const floor = property.floorPrice > 0 ? property.floorPrice : property.price;

  if (budget >= floor) {
    return {
      requirement: "budget",
      severity: "adjustable",
      detail:
        "Their budget is under the asking price but still inside the range the owner authorised, so a concession can close this gap. Trade it for one of the listed concession conditions - never give it away.",
    };
  }

  if (budget >= Math.round(floor * (1 - BRIDGEABLE_BAND))) {
    return {
      requirement: "budget",
      severity: "bridgeable",
      detail:
        "Their budget sits just below what the owner can accept. Do not keep haggling and do not quote the owner's bottom line - invite them to see the home and meet the owner in person instead.",
    };
  }

  return {
    requirement: "budget",
    severity: "hard",
    detail: "Their budget is too far below what the owner can accept for any version of this deal to work.",
  };
}

/**
 * The verdict for one property against one caller's stated requirements.
 * Anything the caller never mentioned lands in `unknown` - never in `missed`, because a
 * requirement that was never stated cannot have been failed.
 */
export function checkPropertyFit(
  requirements: BuyerRequirements,
  property: FitProperty
): FitCheckResult {
  const met: string[] = [];
  const missed: FitMiss[] = [];
  const unknown: string[] = [];

  // City. A home cannot move, so a mismatch is absolute.
  if (!requirements.city) {
    unknown.push("city");
  } else if (sameCity(property.city, requirements.city)) {
    met.push("city");
  } else {
    missed.push({
      requirement: "city",
      severity: "hard",
      detail: `They are looking in ${requirements.city} and this home is in ${property.city || "another city"}.`,
    });
  }

  // Renting versus buying. Not something an agent can convert.
  if (!requirements.listingType) {
    unknown.push("rent or buy");
  } else if (requirements.listingType === property.listingType) {
    met.push("rent or buy");
  } else {
    missed.push({
      requirement: "rent or buy",
      severity: "hard",
      detail: `They want to ${requirements.listingType === "rent" ? "rent" : "buy"} and this home is listed for ${property.listingType}.`,
    });
  }

  // Bedrooms. A room cannot be added, so falling short is absolute; extra rooms are fine.
  if (!requirements.bedrooms) {
    unknown.push("bedrooms");
  } else if (property.bedrooms !== null && property.bedrooms >= requirements.bedrooms) {
    met.push("bedrooms");
  } else if (property.bedrooms === null) {
    unknown.push("bedrooms");
  } else {
    missed.push({
      requirement: "bedrooms",
      severity: "hard",
      detail: `They need ${requirements.bedrooms} bedrooms and this home has ${property.bedrooms}.`,
    });
  }

  // Pets. Only an explicit prohibition is a hard miss - an absent policy is unverified,
  // not a refusal, and saying otherwise would invent a rule the owner never set.
  if (requirements.petsNeeded === null) {
    unknown.push("pets");
  } else if (!requirements.petsNeeded) {
    met.push("pets");
  } else if (property.isPetFriendly) {
    met.push("pets");
  } else if (property.petPolicyDetail && PETS_PROHIBITED.test(property.petPolicyDetail)) {
    missed.push({
      requirement: "pets",
      severity: "hard",
      detail: "They have a pet and this home's policy does not allow pets.",
    });
  } else {
    unknown.push("pets");
  }

  const budget = checkBudget(requirements, property);
  if (budget === null) {
    unknown.push("budget");
  } else if (budget === "met") {
    met.push("budget");
  } else {
    missed.push(budget);
  }

  if (!requirements.moveInTimeline) unknown.push("move-in timing");

  // A constraint of this home outranks an open question it has no stake in: raising the
  // pet policy before they fall for the place is the honest order, not the convenient one.
  const propertyConstrained = new Set<string>();
  if (!property.isPetFriendly) propertyConstrained.add("pets");
  if (property.price > 0) propertyConstrained.add("budget");
  unknown.sort((a, b) => Number(propertyConstrained.has(b)) - Number(propertyConstrained.has(a)));

  let verdict: FitVerdict = "fit";
  if (missed.some((m) => m.severity === "hard")) verdict = "hard";
  else if (missed.some((m) => m.severity === "bridgeable")) verdict = "bridgeable";
  else if (missed.length > 0) verdict = "adjustable";

  return { verdict, met, missed, unknown };
}
