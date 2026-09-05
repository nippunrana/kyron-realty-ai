import {
  Building2,
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

/** The six core attributes the deploy button waits on, with their display values. */
export function buildChecklistItems(property: Property): ChecklistItemData[] {
  // 6-Point Verification Items
  const hasListingType = Boolean(
    property.listingType === "rent" || property.listingType === "sale"
  );
  const hasAddress = Boolean(property.address && property.address.trim().length > 0);
  const hasPrice = Number(property.price) > 0;
  const hasBeds = Number(property.bedrooms) > 0;
  const hasBaths = Number(property.bathrooms) > 0;
  const hasSqft = Number(property.sqft) > 0;

  const checklistItems: ChecklistItemData[] = [
    {
      id: "listing_type",
      label: "Listing Type",
      sublabel: "Rent vs. Sale",
      isComplete: hasListingType,
      valueDisplay: hasListingType
        ? property.listingType === "rent"
          ? "For Rent"
          : "For Sale"
        : null,
    },
    {
      id: "address",
      label: "Location & Address",
      sublabel: "Street, City, State",
      isComplete: hasAddress,
      valueDisplay: hasAddress
        ? `${property.address}${property.city ? `, ${property.city}` : ""}`
        : null,
    },
    {
      id: "price",
      label: "Price / Monthly Rent",
      sublabel: "Asking price or monthly rent",
      isComplete: hasPrice,
      valueDisplay: hasPrice
        ? `$${Number(property.price).toLocaleString()}${
            property.listingType === "rent" ? "/mo" : ""
          }`
        : null,
    },
    {
      id: "bedrooms",
      label: "Bedrooms count",
      sublabel: "Number of bedrooms",
      isComplete: hasBeds,
      valueDisplay: hasBeds ? `${property.bedrooms} Beds` : null,
    },
    {
      id: "bathrooms",
      label: "Bathrooms count",
      sublabel: "Number of full/half baths",
      isComplete: hasBaths,
      valueDisplay: hasBaths ? `${property.bathrooms} Baths` : null,
    },
    {
      id: "sqft",
      label: "Square footage / Size",
      sublabel: "Interior floor area (sf)",
      isComplete: hasSqft,
      valueDisplay: hasSqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
    },
  ];


  return checklistItems;
}

/** Secondary attributes revealed only once they are actually present in the draft. */
export function buildAdditionalSpecs(property: Property, knowledgeBase: KnowledgeBase): AdditionalSpec[] {
  // Track additional/secondary parameters (excluding the 6 core checklist items)
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

  // 2. Property Subtype
  if (
    property.propertyType &&
    property.propertyType.trim().length > 0 &&
    property.propertyType !== "apartment"
  ) {
    const subtypeLabels: Record<string, string> = {
      single_family: "Single Family Home",
      condo: "Condominium",
      townhouse: "Townhouse",
      commercial: "Commercial Space",
    };
    const formattedType = subtypeLabels[property.propertyType] || "Residential Property";

    additionalSpecs.push({
      id: "property_type",
      label: "Property Subtype",
      value: formattedType,
      icon: Building2,
      color: "blue",
    });
  }

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

  // 4. Monthly HOA Fee
  if (property.hoaFeeMonthly && Number(property.hoaFeeMonthly) > 0) {
    additionalSpecs.push({
      id: "hoa_fee",
      label: "Monthly HOA Fee",
      value: `$${Number(property.hoaFeeMonthly).toLocaleString()}/mo`,
      icon: Tag,
      color: "amber",
    });
  }

  // 5. Security Deposit
  if (property.securityDeposit && Number(property.securityDeposit) > 0) {
    additionalSpecs.push({
      id: "security_deposit",
      label: "Security Deposit",
      value: `$${Number(property.securityDeposit).toLocaleString()}`,
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
