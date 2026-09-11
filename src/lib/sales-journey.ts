/**
 * The shape of a sales call's running memory, shared by the browser that holds it and the
 * server that folds new turns into it. Kept dependency-free so importing the type into a
 * client component never drags the Gemini SDK into the bundle.
 */
import { emptyRequirements, type BuyerRequirements } from "./property-fit.ts";

/** One home discussed on this call, and how the caller reacted to it. */
export interface PropertyVisitNote {
  /** Keyed by slug, not title: the browser knows the slug from the URL on every entry path. */
  slug: string;
  title: string;
  notes: string;
}

export interface JourneyTurn {
  role: "user" | "assistant" | "system";
  text: string;
}

export interface SalesJourney {
  /** Structured and merged field by field - never re-summarised, so numbers cannot decay. */
  requirements: BuyerRequirements;
  /** What they said while searching, in one or two sentences. */
  searchSummary: string;
  /** Homes discussed on this call, oldest first. */
  visits: PropertyVisitNote[];
}

export function emptyJourney(): SalesJourney {
  return { requirements: emptyRequirements(), searchSummary: "", visits: [] };
}
