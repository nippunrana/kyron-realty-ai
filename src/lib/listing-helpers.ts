/**
 * Pure, dependency-free helpers shared by the server-side synthesizer, API routes,
 * and client components. Keep this module free of server-only imports so it stays
 * safe to bundle into the browser.
 */

export type ListingType = "rent" | "sale" | "";

/** Share of the target price the voice agent may never go below when no floor is set. */
const DEFAULT_FLOOR_PRICE_RATIO = 0.94;

export function computeFloorPrice(targetPrice: number): number {
  return targetPrice > 0 ? Math.round(targetPrice * DEFAULT_FLOOR_PRICE_RATIO) : 0;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function randomSlugSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

export function buildDefaultTitle(address: string, bedrooms?: number, listingType?: ListingType): string {
  const typeLabel =
    listingType === "rent" ? "Residence for Rent" : listingType === "sale" ? "Residence for Sale" : "Residence";
  return `${bedrooms ? `${bedrooms}-Bedroom ` : ""}${typeLabel} at ${address}`;
}

/**
 * Tomorrow (UTC calendar day) at the given hour, formatted for `<input type="datetime-local">`.
 * Uses UTC so the server-rendered value and the client's hydration value are identical.
 */
export function defaultTourDateTime(hour = 14): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(hour)}:00`;
}
