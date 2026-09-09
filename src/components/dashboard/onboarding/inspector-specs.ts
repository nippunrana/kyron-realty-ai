import {
  Calendar,
  Car,
  Clock,
  Hash,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Tag,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import {
  describePropertyType,
  formatCompositeAddress,
  FURNISHING_LABELS,
  isCommercial,
  isPropertyType,
  type FurnishingStatus,
} from "@/lib/property-types";
import type { ChecklistItemData } from "./VerificationChecklist";

type Property = ExtractedPropertyPayload["property"];
type KnowledgeBase = ExtractedPropertyPayload["knowledgeBase"];

export interface AdditionalSpec {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

/** A declared studio: zero bedrooms with "studio" in the title or description. A bare 0 is an unstated count. */
export function isStudioListing(property: Property): boolean {
  return (
    Number(property.bedrooms) === 0 &&
    `${property.title} ${property.description}`.toLowerCase().includes("studio")
  );
}

/**
 * Which seven rows the checklist is made of. A commercial unit has no bedrooms and no
 * bathrooms, so those two slots are replaced by washrooms and furnishing status rather
 * than left permanently unverifiable - which is what used to lock commercial listings
 * out of deployment entirely.
 */
const RESIDENTIAL_ROWS = [
  "listingType",
  "propertyType",
  "address",
  "price",
  "bedrooms",
  "bathrooms",
  "sqft",
] as const;

const COMMERCIAL_ROWS = [
  "listingType",
  "propertyType",
  "address",
  "price",
  "sqft",
  "washrooms",
  "furnishingStatus",
] as const;

export type CoreSpecKey = (typeof RESIDENTIAL_ROWS)[number] | (typeof COMMERCIAL_ROWS)[number];

export function getCoreSpecRows(property: Property): readonly CoreSpecKey[] {
  return isCommercial(property.propertyType) ? COMMERCIAL_ROWS : RESIDENTIAL_ROWS;
}

/**
 * The one definition of "core specs verified". The checklist, the deploy lock, the
 * studio's review-card gate, the review card, and the end-of-call merge all consume
 * it; never re-derive these rules in a component.
 *
 * Every key is answered honestly here; `getCoreSpecRows` decides which seven of them
 * this listing is actually judged on.
 */
export function getCoreSpecStatus(
  property: Property,
  knowledgeBase?: Partial<KnowledgeBase>
): Record<CoreSpecKey, boolean> {
  return {
    listingType: property.listingType === "rent" || property.listingType === "sale",
    // Property type verifies as soon as a valid property type is selected/stated.
    propertyType: isPropertyType(property.propertyType),
    address: Boolean(property.address && property.address.trim().length > 3),
    price: Number(property.price) > 0,
    bedrooms: Number(property.bedrooms) > 0 || isStudioListing(property),
    bathrooms: Number(property.bathrooms) > 0,
    sqft: Number(property.sqft) > 0,
    // A commercial unit with tower-provided or stated washrooms counts as verified.
    washrooms:
      (property.washrooms !== null && property.washrooms !== undefined && property.washrooms >= 0) ||
      Boolean(knowledgeBase?.washroomDetail && knowledgeBase.washroomDetail.trim().length > 0),
    furnishingStatus: Boolean(property.furnishingStatus),
  };
}

export function areCoreSpecsVerified(
  property: Property,
  knowledgeBase?: Partial<KnowledgeBase>
): boolean {
  const status = getCoreSpecStatus(property, knowledgeBase);
  return getCoreSpecRows(property).every((key) => status[key]);
}

/** The seven core attributes the deploy button waits on, with their display values. */
export function buildChecklistItems(
  property: Property,
  knowledgeBase?: Partial<KnowledgeBase>
): ChecklistItemData[] {
  const status = getCoreSpecStatus(property, knowledgeBase);
  const commercial = isCommercial(property.propertyType);

  const items: Record<CoreSpecKey, ChecklistItemData> = {
    listingType: {
      id: "listing_type",
      label: "Listing Type",
      sublabel: "Rent vs. Sale",
      isComplete: status.listingType,
      valueDisplay: status.listingType
        ? property.listingType === "rent"
          ? "For Rent"
          : "For Sale"
        : null,
    },
    propertyType: {
      id: "property_type",
      label: "Property Type",
      sublabel: "Flat, house, or commercial space",
      isComplete: status.propertyType,
      valueDisplay: describePropertyType(property),
    },
    address: {
      id: "address",
      label: "Location & Address",
      sublabel: "Street, City, State",
      isComplete: status.address,
      valueDisplay: status.address
        ? formatCompositeAddress(property)
        : null,
    },
    price: {
      id: "price",
      label: "Price / Monthly Rent",
      sublabel: "Asking price or monthly rent",
      isComplete: status.price,
      valueDisplay: status.price
        ? `₹${Number(property.price).toLocaleString("en-IN")}${
            property.listingType === "rent" ? "/mo" : ""
          }`
        : null,
    },
    bedrooms: {
      id: "bedrooms",
      label: "Bedrooms count",
      sublabel: "Number of bedrooms",
      isComplete: status.bedrooms,
      valueDisplay: status.bedrooms
        ? isStudioListing(property)
          ? "Studio"
          : `${property.bedrooms} Beds`
        : null,
    },
    bathrooms: {
      id: "bathrooms",
      label: "Bathrooms count",
      sublabel: "Number of full/half baths",
      isComplete: status.bathrooms,
      valueDisplay: status.bathrooms ? `${property.bathrooms} Baths` : null,
    },
    sqft: {
      id: "sqft",
      label: commercial ? "Carpet area" : "Square footage / Size",
      sublabel: commercial ? "Usable carpet area (sf)" : "Interior floor area (sf)",
      isComplete: status.sqft,
      valueDisplay: status.sqft ? `${Number(property.sqft).toLocaleString("en-IN")} sqft` : null,
    },
    washrooms: {
      id: "washrooms",
      label: "Washrooms",
      sublabel: "Washroom arrangement",
      isComplete: status.washrooms,
      valueDisplay: status.washrooms
        ? knowledgeBase?.washroomDetail
          ? knowledgeBase.washroomDetail
          : property.washrooms === 0
          ? "Tower Provided"
          : `${property.washrooms} Washroom${property.washrooms === 1 ? "" : "s"}`
        : null,
    },
    furnishingStatus: {
      id: "furnishing_status",
      label: "Furnishing",
      sublabel: "Bare shell, semi- or fully furnished",
      isComplete: status.furnishingStatus,
      valueDisplay: property.furnishingStatus
        ? FURNISHING_LABELS[property.furnishingStatus as Exclude<FurnishingStatus, "">]
        : null,
    },
  };

  return getCoreSpecRows(property).map((key) => items[key]);
}

/** Secondary attributes revealed only once they are actually present in the draft. */
export function buildAdditionalSpecs(property: Property, knowledgeBase: KnowledgeBase): AdditionalSpec[] {
  // Track additional/secondary parameters (excluding the 7 core checklist rows)
  const additionalSpecs: AdditionalSpec[] = [];

  // 1. Year Built
  if (property.yearBuilt && Number(property.yearBuilt) > 0) {
    additionalSpecs.push({
      id: "year_built",
      label: "Year Built",
      value: `${property.yearBuilt}`,
      icon: Calendar,
      color: "slate",
    });
  }

  // 2. (Property type is a core checklist row - never repeat it here.)

  // 3. Unit / Suite Number
  if (property.unitNumber && property.unitNumber.trim().length > 0) {
    additionalSpecs.push({
      id: "unit_number",
      label: "Unit / Suite #",
      value: property.unitNumber.startsWith("#") ? property.unitNumber : `#${property.unitNumber}`,
      icon: Hash,
      color: "indigo",
    });
  }

  // 4. Society Maintenance / Dues
  if (property.hoaFeeMonthly && Number(property.hoaFeeMonthly) > 0) {
    additionalSpecs.push({
      id: "hoa_fee",
      label: "Society Maintenance",
      value: `₹${Number(property.hoaFeeMonthly).toLocaleString("en-IN")}/mo`,
      icon: Tag,
      color: "amber",
    });
  }

  // 5. Security Deposit
  if (property.securityDeposit && Number(property.securityDeposit) > 0) {
    additionalSpecs.push({
      id: "security_deposit",
      label: "Security Deposit",
      value: `₹${Number(property.securityDeposit).toLocaleString("en-IN")}`,
      icon: ShieldCheck,
      color: "emerald",
    });
  }

  // 6. Minimum Lease Term (Rental)
  if (
    property.listingType === "rent" &&
    property.minLeaseMonths &&
    Number(property.minLeaseMonths) > 0 &&
    property.minLeaseMonths !== 12
  ) {
    additionalSpecs.push({
      id: "min_lease",
      label: "Min. Lease Term",
      value: `${property.minLeaseMonths} Months`,
      icon: Clock,
      color: "cyan",
    });
  }

  // 7. Available Date
  if (property.availableDate && property.availableDate.trim().length > 0) {
    additionalSpecs.push({
      id: "available_date",
      label: "Available Date",
      value: property.availableDate,
      icon: Calendar,
      color: "emerald",
    });
  }

  // 8. Parking Setup
  if (knowledgeBase.parkingDetail && knowledgeBase.parkingDetail.trim().length > 0) {
    additionalSpecs.push({
      id: "parking_detail",
      label: "Parking Setup",
      value: knowledgeBase.parkingDetail,
      icon: Car,
      color: "blue",
    });
  }

  // 9. Pet Policy (For rent or if specified)
  if (knowledgeBase.petPolicyDetail && knowledgeBase.petPolicyDetail.trim().length > 0) {
    additionalSpecs.push({
      id: "pet_policy",
      label: "Pet Policy",
      value: knowledgeBase.petPolicyDetail,
      icon: PawPrint,
      color: "emerald",
    });
  }

  // 10. Utilities Detail
  if (knowledgeBase.utilitiesDetail && knowledgeBase.utilitiesDetail.trim().length > 0) {
    additionalSpecs.push({
      id: "utilities_detail",
      label: "Utilities",
      value: knowledgeBase.utilitiesDetail,
      icon: Zap,
      color: "amber",
    });
  }

  // 11. Features
  if (property.features && property.features.length > 0) {
    property.features.forEach((feat, idx) => {
      additionalSpecs.push({
        id: `feature_${idx}`,
        label: "Feature Highlight",
        value: feat,
        icon: Sparkles,
        color: "indigo",
      });
    });
  }


  return additionalSpecs;
}
