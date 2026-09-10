/**
 * The one definition of what kind of place a listing is: the type vocabulary, the labels
 * a reader sees, and the helpers that classify and format them.
 *
 * Which specs a listing is judged on lives in `inspector-specs.ts`, not here.
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

export const FURNISHING_LABELS: Record<Exclude<FurnishingStatus, "">, string> = {
  bare_shell: "Bare shell",
  semi_furnished: "Semi-furnished",
  fully_furnished: "Fully furnished",
};

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

/** The type row's value as the owner reads it: "Office Space", "Flat / Apartment". */
export function describePropertyType(facts: TypeFacts): string | null {
  const { propertyType } = facts;
  if (!isPropertyType(propertyType)) return null;
  return PROPERTY_TYPE_LABELS[propertyType];
}

export interface AddressFacts {
  address?: string | null;
  unitNumber?: string | null;
  floorNumber?: number | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

/** Formats the composite address with unit, floor, street, and city: "Unit 121, 2nd floor, Sector 7, Faridabad". */
export function formatCompositeAddress(facts: AddressFacts): string | null {
  const parts: string[] = [];
  if (facts.unitNumber && facts.unitNumber.trim().length > 0) {
    const u = facts.unitNumber.trim();
    parts.push(u.toLowerCase().startsWith("unit") || u.startsWith("#") ? u : `Unit ${u}`);
  }
  if (facts.floorNumber !== null && facts.floorNumber !== undefined) {
    parts.push(formatFloor(facts.floorNumber));
  }
  if (facts.address && facts.address.trim().length > 0) {
    parts.push(facts.address.trim());
  }
  if (facts.city && facts.city.trim().length > 0) {
    parts.push(facts.city.trim());
  }
  return parts.length > 0 ? parts.join(", ") : null;
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
