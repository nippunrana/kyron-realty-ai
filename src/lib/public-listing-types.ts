import type { HyperLocalKbData } from "@/db/schema";

export interface PublicProperty {
  id: number;
  slug: string;
  status: string;
  title: string;
  description: string | null;
  address: string;
  unitNumber?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  listingType: string;
  propertyType: string;
  price: string;
  securityDeposit?: string | null;
  minLeaseMonths?: number | null;
  hoaFeeMonthly?: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  sqft: number | null;
  floorNumber?: number | null;
  storeys?: number | null;
  rentScope?: string | null;
  washrooms?: number | null;
  furnishingStatus?: string | null;
  yearBuilt?: number | null;
  availableDate: string | Date | null;
  coverImageUrl?: string | null;
  images?: string[] | null;
  amenities?: string[] | null;
  features?: string[] | null;
  qrCodeSvg?: string | null;
}

export interface PublicKnowledgeBase {
  synthesizedSalesPitch?: string | null;
  neighborhoodSummary?: string | null;
  schoolDistrictInfo?: string | null;
  petPolicyDetail?: string | null;
  parkingDetail?: string | null;
  utilitiesDetail?: string | null;
  washroomDetail?: string | null;
  applicationProcess?: string | null;
  faqs?: Array<{ question: string; answer: string; category: string }>;
  hyperLocal?: HyperLocalKbData | null;
}

export interface PublicListingClientProps {
  property: PublicProperty;
  knowledgeBase: PublicKnowledgeBase;
  media: Array<{ id: number; url: string; mediaType?: string }>;
  shareUrl: string;
}
