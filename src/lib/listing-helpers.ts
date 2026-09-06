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

/**
 * Safely parses an available date from an ISO string, timestamp, or natural language relative phrase
 * (e.g., "In 7 Days", "Within 14 Days", "Immediately"). Returns a valid Date or null, never throwing
 * "RangeError: Invalid time value".
 */
export function parseAvailableDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Try direct standard parse
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // Parse natural language relative timelines extracted by AI or entered by user
  const lower = trimmed.toLowerCase();
  if (lower.includes("immediately") || lower.includes("now") || lower.includes("today")) {
    return new Date();
  }

  // e.g. "in 7 days", "within 14 days", "ready in 15 days", "7 days"
  const daysMatch = lower.match(/(?:in|within|ready in)?\s*(\d+)\s*days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    if (!isNaN(days)) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    }
  }

  // e.g. "in 2 weeks", "within 2 weeks"
  const weeksMatch = lower.match(/(?:in|within|ready in)?\s*(\d+)\s*weeks?/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    if (!isNaN(weeks)) {
      const d = new Date();
      d.setDate(d.getDate() + weeks * 7);
      return d;
    }
  }

  // e.g. "in 1 month", "in 2 months"
  const monthsMatch = lower.match(/(?:in|within|ready in)?\s*(\d+)\s*months?/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10);
    if (!isNaN(months)) {
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      return d;
    }
  }

  // Fallback: If it cannot be parsed into a calendar date, return null so DB insert never crashes
  return null;
}

