"use client";

import { useMemo } from "react";
import { Car, PawPrint, Zap, Calendar, Building2, Sparkles, Check, Home, Wrench } from "lucide-react";
import type { PillLabels } from "@/lib/turn-extractor";

interface ChipItem {
  label: string;
  value: string;
  field: "parkingDetail" | "petPolicyDetail" | "utilitiesDetail" | "hoaFeeMonthly" | "availableDate" | "feature";
  matches?: (current: string) => boolean;
}

interface SuggestionGroup {
  id: string;
  label: string;
  icon: any;
  field: "parkingDetail" | "petPolicyDetail" | "utilitiesDetail" | "hoaFeeMonthly" | "availableDate" | "feature";
  chips: ChipItem[];
}

interface ExtraSpecsSuggestionBarProps {
  listingType: "rent" | "sale";
  currentValues: {
    parkingDetail?: string;
    petPolicyDetail?: string;
    utilitiesDetail?: string;
    hoaFeeMonthly?: number;
    availableDate?: string;
    features?: string[];
  };
  pillLabels?: PillLabels;
  onApplyChip: (field: string, value: any) => void;
}

/** Helper to extract a clean fallback pill title from a freeform text value */
function deriveFallbackPill(text: string, category: string): string {
  const clean = text.replace(/^(yes|uh|there is|we have|it has|about)\s+/i, "").trim();
  if (!clean) return "Custom Selected";

  // Category-specific heuristic summaries
  if (category === "parking") {
    const numMatch = clean.match(/(\d+)[- ]*(car|spot|space|vehicle)/i);
    if (numMatch) return `${numMatch[1]}-Car Parking`;
    if (/garage/i.test(clean)) return "Garage Parking";
    if (/street/i.test(clean)) return "Street Parking";
    if (/driveway/i.test(clean)) return "Driveway";
  } else if (category === "pets") {
    if (/\b(no\s+pets?|no\s+animals?)\b/i.test(clean)) return "No Pets";
    if (/\bdogs?\b/i.test(clean) && /\bcats?\b/i.test(clean)) return "Cats & Dogs OK";
    if (/\bdogs?\b/i.test(clean)) return "Dogs Welcome";
    if (/\bcats?\b/i.test(clean)) return "Cats Welcome";
  } else if (category === "utilities") {
    if (/all\s+util/i.test(clean)) return "All Utilities Incl.";
    if (/water/i.test(clean) && /trash/i.test(clean)) return "Water & Trash Incl.";
    if (/water/i.test(clean)) return "Water Included";
    if (/electric/i.test(clean)) return "Tenant Pays Electric";
  } else if (category === "availability") {
    const daysMatch = clean.match(/(\d+)\s*days?/i);
    if (daysMatch) return `In ${daysMatch[1]} Days`;
    if (/immediately|now|ready/i.test(clean)) return "Available Now";
    if (/1st\s+of\s+next\s+month/i.test(clean)) return "1st Next Month";
  }

  // Generic truncation
  const words = clean.split(/\s+/).slice(0, 3).join(" ");
  return words.length > 20 ? words.slice(0, 18) + "..." : words;
}

export function ExtraSpecsSuggestionBar({
  listingType,
  currentValues,
  pillLabels,
  onApplyChip,
}: ExtraSpecsSuggestionBarProps) {
  const isRent = listingType === "rent";

  const rentGroups: SuggestionGroup[] = useMemo(
    () => [
      {
        id: "parking",
        label: "Parking Setup",
        icon: Car,
        field: "parkingDetail",
        chips: [
          {
            label: "2-Car Garage",
            value: "2-car attached garage included",
            field: "parkingDetail",
            matches: (cur) => /\b2[- ]car\b/i.test(cur) && /\bgarage\b/i.test(cur),
          },
          {
            label: "1 Assigned Stall",
            value: "1 assigned covered parking space",
            field: "parkingDetail",
            matches: (cur) => /\b1\s+assigned\b/i.test(cur) || /\b1[- ]car\b/i.test(cur),
          },
          {
            label: "EV Charger",
            value: "Dedicated parking with Level 2 EV charger",
            field: "parkingDetail",
            matches: (cur) => /\bev\b|charger|electric vehicle/i.test(cur),
          },
          {
            label: "Street Permit",
            value: "Street parking with city permit",
            field: "parkingDetail",
            matches: (cur) => /\bstreet\s+permit\b|city\s+permit/i.test(cur),
          },
          {
            label: "No Parking",
            value: "Street parking only / No dedicated spot",
            field: "parkingDetail",
            matches: (cur) => /\bno\s+parking\b|no\s+dedicated\s+spot/i.test(cur),
          },
        ],
      },
      {
        id: "pets",
        label: "Pet Policy",
        icon: PawPrint,
        field: "petPolicyDetail",
        chips: [
          {
            label: "Cats & Dogs OK",
            value: "Cats and dogs welcome with standard pet deposit",
            field: "petPolicyDetail",
            matches: (cur) => (/\bdogs?\b/i.test(cur) && /\bcats?\b/i.test(cur)) || /pets?\s+(are\s+)?allowed/i.test(cur),
          },
          {
            label: "Small Dogs Only (<25 lbs)",
            value: "Small dogs (<25 lbs) and cats allowed",
            field: "petPolicyDetail",
            matches: (cur) => /small\s+dogs?|25\s*lbs/i.test(cur),
          },
          {
            label: "Cats Only",
            value: "Cats allowed; no dogs permitted",
            field: "petPolicyDetail",
            matches: (cur) => /\bcats?\s+only\b|no\s+dogs?\s+permitted/i.test(cur),
          },
          {
            label: "No Pets",
            value: "No pets allowed on premises",
            field: "petPolicyDetail",
            matches: (cur) => /\b(no\s+pets?|no\s+animals?|pets?\s+not\s+allowed)\b/i.test(cur),
          },
        ],
      },
      {
        id: "utilities",
        label: "Utilities Inclusions",
        icon: Zap,
        field: "utilitiesDetail",
        chips: [
          {
            label: "Water & Trash Incl.",
            value: "Water, sewer, and trash included in rent; tenant pays electric and gas",
            field: "utilitiesDetail",
            matches: (cur) => /\bwater\b/i.test(cur) && /\btrash\b/i.test(cur),
          },
          {
            label: "All Utilities Incl.",
            value: "All utilities included (water, gas, electric, high-speed internet)",
            field: "utilitiesDetail",
            matches: (cur) => /all\s+utilities/i.test(cur),
          },
          {
            label: "Tenant Pays Electric",
            value: "Water and garbage covered; tenant pays electricity and gas",
            field: "utilitiesDetail",
            matches: (cur) => /tenant\s+pays\s+electric/i.test(cur),
          },
          {
            label: "Tenant Pays All",
            value: "Tenant responsible for all utilities (electric, gas, water, internet)",
            field: "utilitiesDetail",
            matches: (cur) => /tenant\s+pays\s+all|tenant\s+responsible\s+for\s+all/i.test(cur),
          },
        ],
      },
      {
        id: "features",
        label: "Comfort & Amenities",
        icon: Sparkles,
        field: "feature",
        chips: [
          { label: "In-Unit W/D", value: "In-unit washer and dryer", field: "feature" },
          { label: "Central A/C", value: "Central air conditioning & heating", field: "feature" },
          { label: "Private Balcony", value: "Private outdoor balcony", field: "feature" },
          { label: "Newly Renovated", value: "Newly renovated kitchen & modern appliances", field: "feature" },
        ],
      },
      {
        id: "availability",
        label: "Move-In Timing",
        icon: Calendar,
        field: "availableDate",
        chips: [
          {
            label: "Available Immediately",
            value: "Available Immediately",
            field: "availableDate",
            matches: (cur) => /immediately|now|ready\s+now/i.test(cur),
          },
          {
            label: "In 30 Days",
            value: "Available in 30 Days",
            field: "availableDate",
            matches: (cur) => /30\s+days/i.test(cur),
          },
          {
            label: "1st of Next Month",
            value: "Available 1st of Next Month",
            field: "availableDate",
            matches: (cur) => /1st\s+of\s+next\s+month/i.test(cur),
          },
        ],
      },
    ],
    []
  );

  const saleGroups: SuggestionGroup[] = useMemo(
    () => [
      {
        id: "hoa",
        label: "HOA / Condo Dues",
        icon: Building2,
        field: "hoaFeeMonthly",
        chips: [
          { label: "No HOA", value: "0", field: "hoaFeeMonthly" },
          { label: "$250/mo HOA", value: "250", field: "hoaFeeMonthly" },
          { label: "$450/mo HOA (Water/Trash)", value: "450", field: "hoaFeeMonthly" },
          { label: "$650/mo Luxury Amenities", value: "650", field: "hoaFeeMonthly" },
        ],
      },
      {
        id: "parking",
        label: "Parking & Garage",
        icon: Car,
        field: "parkingDetail",
        chips: [
          {
            label: "2-Car Garage",
            value: "2-car attached garage included",
            field: "parkingDetail",
            matches: (cur) => /\b2[- ]car\b/i.test(cur) && /\bgarage\b/i.test(cur),
          },
          {
            label: "3-Car Garage",
            value: "3-car garage with workshop space",
            field: "parkingDetail",
            matches: (cur) => /\b3[- ]car\b/i.test(cur),
          },
          {
            label: "Assigned Space",
            value: "Assigned deeded garage space",
            field: "parkingDetail",
            matches: (cur) => /assigned/i.test(cur),
          },
          {
            label: "Driveway Parking",
            value: "Private driveway parking for 2+ cars",
            field: "parkingDetail",
            matches: (cur) => /driveway/i.test(cur),
          },
        ],
      },
      {
        id: "occupancy",
        label: "Occupancy Status",
        icon: Home,
        field: "feature",
        chips: [
          { label: "Vacant / Move-in Ready", value: "Vacant and move-in ready for fast closing", field: "feature" },
          { label: "Owner-Occupied", value: "Owner-occupied; standard 30-day closing", field: "feature" },
          { label: "Tenant-Occupied", value: "Tenant-occupied investment property", field: "feature" },
        ],
      },
      {
        id: "upgrades",
        label: "Upgrades & Condition",
        icon: Wrench,
        field: "feature",
        chips: [
          { label: "Remodeled Kitchen", value: "Chef kitchen remodel with quartz countertops", field: "feature" },
          { label: "New Roof (2023)", value: "Brand new architectural shingle roof (2023)", field: "feature" },
          { label: "New HVAC", value: "High-efficiency modern HVAC system installed recently", field: "feature" },
          { label: "Solar Panels", value: "Owned rooftop solar system with minimal electric bills", field: "feature" },
        ],
      },
    ],
    []
  );

  const groups = isRent ? rentGroups : saleGroups;

  /** Precise chip active detection eliminating substring false positives */
  const isChipActive = (chip: ChipItem): boolean => {
    const { field, value, matches } = chip;
    if (field === "parkingDetail" || field === "petPolicyDetail" || field === "utilitiesDetail") {
      const current = (currentValues[field] || "").trim();
      if (!current) return false;
      if (matches) return matches(current);
      return current.toLowerCase() === value.toLowerCase();
    }
    if (field === "hoaFeeMonthly") {
      return Number(currentValues.hoaFeeMonthly) === Number(value);
    }
    if (field === "availableDate") {
      const current = (currentValues.availableDate || "").trim();
      if (!current) return false;
      if (matches) return matches(current);
      return current.toLowerCase() === value.toLowerCase();
    }
    if (field === "feature") {
      return Boolean(
        currentValues.features &&
          currentValues.features.some((f) => f.toLowerCase() === value.toLowerCase() || f.toLowerCase().includes(chip.label.toLowerCase()))
      );
    }
    return false;
  };

  /** Determine if a category has a custom user value that warrants a dynamic selected pill */
  const getDynamicPillInfo = (group: SuggestionGroup): { label: string; value: any } | null => {
    let cur = "";
    let pillText: string | undefined;

    if (group.id === "parking") {
      cur = (currentValues.parkingDetail || "").trim();
      pillText = pillLabels?.parking;
    } else if (group.id === "pets") {
      cur = (currentValues.petPolicyDetail || "").trim();
      pillText = pillLabels?.pets;
    } else if (group.id === "utilities") {
      cur = (currentValues.utilitiesDetail || "").trim();
      pillText = pillLabels?.utilities;
    } else if (group.id === "availability") {
      cur = (currentValues.availableDate || "").trim();
      pillText = pillLabels?.availableDate;
    } else if (group.id === "hoa") {
      const hoaVal = Number(currentValues.hoaFeeMonthly) || 0;
      if (hoaVal <= 0) return null;
      cur = String(hoaVal);
      pillText = pillLabels?.hoa;
    }

    if (!cur) return null;

    // Check if any prebuilt chip is already active
    const activeChip = group.chips.find(isChipActive);
    if (activeChip) {
      // If no explicit pillText, or if the pillText matches the active chip's label,
      // the existing active chip is already highlighted and handles the visual representation
      if (!pillText || activeChip.label.toLowerCase() === pillText.toLowerCase()) {
        return null;
      }
    }

    const label = pillText || deriveFallbackPill(cur, group.id);
    return { label, value: cur };
  };

  return (
    <div
      id="extra-specs-suggestion-bar"
      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-indigo-100 shadow-2xs transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block leading-none">
              Additional Specs & AI Knowledge Suggestions
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Click to apply or answer Elena Vance verbally over voice
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
          {isRent ? "Rental Insights" : "Sale Intelligence"}
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const Icon = group.icon;
          const dynamicPill = getDynamicPillInfo(group);
          // If a dynamic pill is present, trim 1-2 prebuilt chips so the row stays neat and balanced,
          // and omit any chip that has the exact same label as the dynamic pill
          const trimmedChips = dynamicPill
            ? group.chips.slice(0, Math.max(2, group.chips.length - 2))
            : group.chips;
          const visibleStaticChips = trimmedChips.filter(
            (chip) => !dynamicPill || chip.label.toLowerCase() !== dynamicPill.label.toLowerCase()
          );

          return (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* 1. Dynamic User-Selected AI Pill (Prepended at front) */}
                {dynamicPill && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white border border-indigo-700 shadow-xs ring-2 ring-indigo-400/40 animate-in fade-in zoom-in-95 duration-200">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                    <span>{dynamicPill.label}</span>
                    <span className="text-[9px] font-black uppercase bg-white/20 text-white px-1 py-0.2 rounded tracking-wider">
                      AI
                    </span>
                  </div>
                )}

                {/* 2. Prebuilt Static Chips */}
                {visibleStaticChips.map((chip) => {
                  const active = isChipActive(chip);
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => onApplyChip(chip.field, chip.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer border ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs font-bold scale-102"
                          : "bg-white text-slate-700 hover:text-indigo-900 hover:bg-indigo-50/70 border-slate-200/90 hover:border-indigo-300"
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" />}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
