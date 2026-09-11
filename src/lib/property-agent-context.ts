/**
 * Turns one property row into the prompt Sarah runs while the caller is on its page.
 * Shared by the cold start (`/session/start` with a slug) and the mid-call handover
 * (`/session/retarget`), so both entries describe the same home the same way.
 */
import { db } from "@/db";
import { properties } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { computeFloorPrice } from "./listing-helpers";
import { checkPropertyFit, type FitCheckResult, type FitProperty } from "./property-fit";
import { buildPropertyPrompt, type PropertyPromptFacts } from "./sarah-property-prompt";
import type { SalesJourney } from "./sales-journey";

export interface PropertyAgentContext {
  propertyId: number;
  title: string;
  greeting: string;
  systemPrompt: string;
  fit: FitCheckResult;
}

function formatDuration(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  return minutes < 1 ? "under a minute" : `${minutes} min`;
}

/**
 * Real measured distances first, in the shape Sarah is told to quote verbatim. Falls back to
 * the named places when the Routes API never ran, and to nothing at all when neither exists -
 * an absent distance must stay absent rather than become "close by".
 */
function buildNearbyLines(kbData: NonNullable<PropertyRow["knowledgeBase"]>["kbData"]): string[] {
  const lines: string[] = [];

  for (const place of kbData?.nearbyDistances || []) {
    const walk = formatDuration(place.walkSeconds);
    const drive = formatDuration(place.driveSeconds);
    const legs = [walk ? `${walk} walk` : null, drive ? `${drive} drive` : null].filter(Boolean);
    if (legs.length) lines.push(`${place.name} (${place.category}) - ${legs.join(", ")}`);
  }

  if (lines.length === 0) {
    const metro = kbData?.transit?.nearestMetro;
    if (metro) lines.push(`Nearest metro: ${metro} (no measured travel time on file)`);
    for (const school of (kbData?.neighborhood?.topSchools || []).slice(0, 3)) {
      lines.push(`School nearby: ${school} (no measured travel time on file)`);
    }
  }

  return lines.slice(0, 8);
}

type PropertyRow = typeof properties.$inferSelect;

function toFacts(row: PropertyRow): PropertyPromptFacts {
  const kb = row.knowledgeBase;
  const kbData = kb?.kbData;
  const rules = row.negotiationRules;

  return {
    title: row.title,
    address: [row.address, row.city, row.state].filter(Boolean).join(", "),
    listingType: row.listingType,
    price: Number(row.price) || 0,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sqft: row.sqft,
    description: row.description,
    salesPitch: kb?.synthesizedSalesPitch || null,
    petPolicy: kb?.petPolicyDetail || null,
    parking: kb?.parkingDetail || null,
    utilities: kb?.utilitiesDetail || null,
    applicationProcess: kb?.applicationProcess || null,
    contactEmail: kb?.contactEmail || null,
    faqs: (kb?.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
    objectionPlaybook: (kbData?.buyerObjectionsAndPlaybook || []).map((p) => ({
      likelyQuestion: p.likelyQuestion,
      voiceAgentRecommendedAnswer: p.voiceAgentRecommendedAnswer,
    })),
    nearby: buildNearbyLines(kbData),
    neighbourhoodVibe: kbData?.neighborhood?.vibeAndLivability || null,
    concessionRules: (rules?.concessionRules || []).map((r) => ({
      condition: r.condition,
      concession: r.concession,
    })),
    // Absent rules mean the owner authorised nothing, so nothing may be offered.
    allowNegotiation: rules?.allowNegotiation !== false && (rules?.concessionRules?.length || 0) > 0,
  };
}

function toFitProperty(row: PropertyRow, facts: PropertyPromptFacts): FitProperty {
  const price = facts.price;
  const targetPrice = Number(row.negotiationRules?.targetPrice) || price;
  const floorPrice = Number(row.negotiationRules?.minFloorPrice) || computeFloorPrice(targetPrice);
  const petDetail = facts.petPolicy || "";
  const features = (row.features as string[]) || [];
  const amenities = (row.amenities as string[]) || [];

  return {
    city: row.city,
    listingType: row.listingType,
    bedrooms: row.bedrooms,
    price,
    floorPrice,
    isPetFriendly:
      features.some((f) => /pet/i.test(f)) ||
      amenities.some((a) => /pet/i.test(a)) ||
      (petDetail.length > 0 && !/no pet|prohibited|not allowed/i.test(petDetail)) ||
      /pet friendly|pets allowed/i.test(row.description || ""),
    petPolicyDetail: facts.petPolicy,
  };
}

/** The display title of a live listing, used to label a visit note. Null when there is none. */
export async function getLivePropertyTitle(slug: string): Promise<string | null> {
  const [row] = await db
    .select({ title: properties.title })
    .from(properties)
    .where(and(eq(properties.slug, slug), ne(properties.status, "draft")))
    .limit(1);
  return row?.title ?? null;
}

/**
 * The property prompt for a slug, or null when no live listing has it - the same
 * `status !== "draft"` gate the public listing page and the search both use, so Sarah can
 * never be retargeted onto a home the caller cannot actually see.
 */
export async function buildPropertyAgentContext(
  slug: string,
  journey: SalesJourney,
  entry: "handover" | "cold"
): Promise<PropertyAgentContext | null> {
  const [row] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.slug, slug), ne(properties.status, "draft")))
    .limit(1);

  if (!row) return null;

  const facts = toFacts(row);
  const fit = checkPropertyFit(journey.requirements, toFitProperty(row, facts));
  const { greeting, systemPrompt } = buildPropertyPrompt({
    facts,
    requirements: journey.requirements,
    fit,
    visits: journey.visits.filter((v) => v.slug !== slug),
    searchSummary: journey.searchSummary,
    entry,
  });

  return { propertyId: row.id, title: row.title, greeting, systemPrompt, fit };
}
