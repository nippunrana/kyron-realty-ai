/**
 * The one definition of what kind of place a listing is, and which follow-up fact
 * that kind of place makes mandatory.
 *
 * A flat has a floor; a house has storeys; a two-storey house offered for rent has to
 * say whether the rent buys the whole building or one floor of it. Those are not extra
 * questions the owner is asked out of nowhere - they are the second half of the type
 * itself, which is why they live here beside the vocabulary rather than as free-standing
 * core specs.
 */

export const RESIDENTIAL_TYPES = [
  "apartment",
  "builder_floor",
  "independent_house",
  "villa",
] as const;

export const COMMERCIAL_TYPES = ["office", "shop_retail", "showroom", "warehouse"] as const;

export type ResidentialType = (typeof RESIDENTIAL_TYPES)[number];
export type CommercialType = (typeof COMMERCIAL_TYPES)[number];
/** `""` is an unstated type. It is never a default - see `docs/built-systems/property-onboarding.md`. */
export type PropertyType = ResidentialType | CommercialType | "";

export type PropertyCategory = "residential" | "commercial";

export type RentScope = "whole_property" | "single_floor" | "";
export type FurnishingStatus = "bare_shell" | "semi_furnished" | "fully_furnished" | "";

export const PROPERTY_TYPE_LABELS: Record<Exclude<PropertyType, "">, string> = {
  apartment: "Flat / Apartment",
  builder_floor: "Builder Floor",
  independent_house: "Independent House",
  villa: "Villa / Bungalow",
  office: "Office Space",
  shop_retail: "Shop / Retail",
  showroom: "Showroom",
  warehouse: "Warehouse / Godown",
};

export const RENT_SCOPE_LABELS: Record<Exclude<RentScope, "">, string> = {
  whole_property: "Whole property",
  single_floor: "One floor only",
};

export const FURNISHING_LABELS: Record<Exclude<FurnishingStatus, "">, string> = {
  bare_shell: "Bare shell",
  semi_furnished: "Semi-furnished",
  fully_furnished: "Fully furnished",
};

/** Types that sit on a floor of a larger building: the owner must say which floor. */
const FLOOR_TYPES: PropertyType[] = ["apartment", "builder_floor", "office", "shop_retail", "showroom"];

/** Types that are their own building: the owner must say how many storeys it has. */
const STOREY_TYPES: PropertyType[] = ["independent_house", "villa", "warehouse"];

export function isPropertyType(value: unknown): value is Exclude<PropertyType, ""> {
  return (
    typeof value === "string" &&
    (RESIDENTIAL_TYPES as readonly string[]).concat(COMMERCIAL_TYPES).includes(value)
  );
}

export function getPropertyCategory(propertyType: PropertyType): PropertyCategory | null {
  if ((RESIDENTIAL_TYPES as readonly string[]).includes(propertyType)) return "residential";
  if ((COMMERCIAL_TYPES as readonly string[]).includes(propertyType)) return "commercial";
  return null;
}

export function isCommercial(propertyType: PropertyType): boolean {
  return getPropertyCategory(propertyType) === "commercial";
}

/** The facts a property type carries with it, beyond the type word. */
export interface TypeFacts {
  propertyType: PropertyType;
  listingType: string;
  floorNumber?: number | null;
  storeys?: number | null;
  rentScope?: RentScope;
}

export type TypeSlot = "type" | "floor" | "storeys" | "rentScope";

/**
 * The next thing still unknown about the property's type, or null when the type row is
 * fully answered. Elena asks for exactly this and nothing else, so a flat is never asked
 * about storeys and a seller is never asked which floor the rent covers.
 */
export function getMissingTypeSlot(facts: TypeFacts): TypeSlot | null {
  const { propertyType, listingType, floorNumber, storeys, rentScope } = facts;

  if (!isPropertyType(propertyType)) return "type";

  if (FLOOR_TYPES.includes(propertyType)) {
    return floorNumber === null || floorNumber === undefined ? "floor" : null;
  }

  if (STOREY_TYPES.includes(propertyType)) {
    if (!storeys || storeys < 1) return "storeys";
    // Only a multi-storey building offered for rent leaves the rent figure ambiguous.
    if (storeys >= 2 && listingType === "rent" && !rentScope) return "rentScope";
    return null;
  }

  return null;
}

export function isTypeVerified(facts: TypeFacts): boolean {
  return getMissingTypeSlot(facts) === null;
}

/** "3rd floor", "Ground floor". A basement reads as such rather than as floor -1. */
export function formatFloor(floorNumber: number): string {
  if (floorNumber < 0) return floorNumber === -1 ? "Basement" : `Basement ${Math.abs(floorNumber)}`;
  if (floorNumber === 0) return "Ground floor";
  const rem100 = floorNumber % 100;
  const suffix =
    rem100 >= 11 && rem100 <= 13
      ? "th"
      : { 1: "st", 2: "nd", 3: "rd" }[floorNumber % 10] || "th";
  return `${floorNumber}${suffix} floor`;
}

/** The type row's value as the owner reads it: "Flat / Apartment · 3rd floor". */
export function describePropertyType(facts: TypeFacts): string | null {
  const { propertyType, floorNumber, storeys, rentScope } = facts;
  if (!isPropertyType(propertyType)) return null;

  const parts = [PROPERTY_TYPE_LABELS[propertyType]];

  if (FLOOR_TYPES.includes(propertyType) && floorNumber !== null && floorNumber !== undefined) {
    parts.push(formatFloor(floorNumber));
  }

  if (STOREY_TYPES.includes(propertyType) && storeys && storeys > 0) {
    parts.push(storeys === 1 ? "Single storey" : `${storeys} storeys`);
    if (rentScope) parts.push(RENT_SCOPE_LABELS[rentScope as Exclude<RentScope, "">]);
  }

  return parts.join(" · ");
}

/** What the type row still needs, phrased for the checklist's pending line. */
export function describeMissingTypeSlot(slot: TypeSlot): string {
  switch (slot) {
    case "type":
      return "Flat, house, or commercial space";
    case "floor":
      return "Which floor is it on?";
    case "storeys":
      return "Single storey or double storey?";
    case "rentScope":
      return "Does the rent cover both floors?";
  }
}

/**
 * Rows written before the India-first vocabulary landed still carry the old US enum, so
 * a display label must never assume the value is one of the current types.
 */
const LEGACY_TYPE_LABELS: Record<string, string> = {
  single_family: "Independent House",
  condo: "Condominium",
  townhouse: "Townhouse",
  commercial: "Commercial Space",
};

/** A stored property_type as a reader should see it, whatever vintage the row is. */
export function formatPropertyTypeLabel(value: string | null | undefined): string {
  if (!value) return "Property";
  if (isPropertyType(value)) return PROPERTY_TYPE_LABELS[value];
  return LEGACY_TYPE_LABELS[value] || value.replace(/_/g, " ");
}
