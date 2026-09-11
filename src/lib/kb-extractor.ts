import type { ListingType } from "./listing-helpers";
import type { GeminiUsage } from "./gemini";
import type { HyperLocalKbData } from "@/db/schema";
import type { FurnishingStatus, PropertyCategory, PropertyType, RentScope } from "./property-types";

export interface ExtractedPropertyPayload {
  property: {
    title: string;
    slug: string;
    description: string;
    listingType: ListingType;
    propertyType: PropertyType;
    price: number;
    securityDeposit: number;
    minLeaseMonths: number;
    hoaFeeMonthly: number;
    address: string;
    unitNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    floorNumber: number | null;
    storeys: number | null;
    rentScope: RentScope;
    washrooms: number | null;
    furnishingStatus: FurnishingStatus;
    yearBuilt: number;
    availableDate?: string;
    amenities: string[];
    features: string[];
    coverImageUrl?: string;
    images: string[];
  };
  knowledgeBase: {
    rawScrapedMarkdown: string;
    synthesizedSalesPitch: string;
    neighborhoodSummary: string;
    schoolDistrictInfo: string;
    petPolicyDetail: string;
    parkingDetail: string;
    utilitiesDetail: string;
    washroomDetail?: string;
    /**
     * Residential or commercial, as the owner said it, before they have narrowed it to
     * one of the eight property types. A intake hint only: it decides which core-spec
     * rows the checklist shows while `propertyType` is still unstated, and is ignored the
     * moment a real type lands. It is never a substitute for the type and never fills it in.
     */
    propertyCategory?: PropertyCategory;
    applicationProcess: string;
    contactEmail?: string;
    pillLabels?: {
      parking?: string;
      pets?: string;
      utilities?: string;
      availableDate?: string;
      hoa?: string;
    };
    faqs: Array<{ question: string; answer: string; category: string }>;
    agentTone: string;
    greetingMessage: string;
    unknownFallbackPolicy?: string;
    kbData?: HyperLocalKbData | null;
    eaScript?: string | null;
  };
  negotiationMatrix: {
    allowNegotiation: boolean;
    targetPrice: number;
    minFloorPrice: number;
    maxAllowedDiscountPct: number;
    concessionRules: Array<{
      condition: string;
      concession: string;
      maxConcessionValue: number;
      requiresApproval: boolean;
    }>;
    notesForAgent: string;
  };
  usage?: GeminiUsage;
}
