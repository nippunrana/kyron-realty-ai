"use client";

import { Car, PawPrint, Zap, Calendar, Building2, Sparkles, Check, Home, Wrench } from "lucide-react";

interface SuggestionGroup {
  id: string;
  label: string;
  icon: any;
  chips: Array<{
    label: string;
    value: string;
    field: "parkingDetail" | "petPolicyDetail" | "utilitiesDetail" | "hoaFeeMonthly" | "availableDate" | "feature";
  }>;
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
  onApplyChip: (field: string, value: any) => void;
}

export function ExtraSpecsSuggestionBar({
  listingType,
  currentValues,
  onApplyChip,
}: ExtraSpecsSuggestionBarProps) {
  const isRent = listingType === "rent";

  const rentGroups: SuggestionGroup[] = [
    {
      id: "parking",
      label: "Parking Setup",
      icon: Car,
      chips: [
        { label: "2-Car Garage", value: "2-car attached garage included", field: "parkingDetail" },
        { label: "1 Assigned Stall", value: "1 assigned covered parking space", field: "parkingDetail" },
        { label: "EV Charger", value: "Dedicated parking with Level 2 EV charger", field: "parkingDetail" },
        { label: "Street Permit", value: "Street parking with city permit", field: "parkingDetail" },
        { label: "No Parking", value: "Street parking only / No dedicated spot", field: "parkingDetail" },
      ],
    },
    {
      id: "pets",
      label: "Pet Policy",
      icon: PawPrint,
      chips: [
        { label: "Cats & Dogs OK", value: "Cats and dogs welcome with standard pet deposit", field: "petPolicyDetail" },
        { label: "Small Dogs Only (<25 lbs)", value: "Small dogs (<25 lbs) and cats allowed", field: "petPolicyDetail" },
        { label: "Cats Only", value: "Cats allowed; no dogs permitted", field: "petPolicyDetail" },
        { label: "No Pets", value: "No pets allowed on premises", field: "petPolicyDetail" },
      ],
    },
    {
      id: "utilities",
      label: "Utilities Inclusions",
      icon: Zap,
      chips: [
        { label: "Water & Trash Incl.", value: "Water, sewer, and trash included in rent; tenant pays electric and gas", field: "utilitiesDetail" },
        { label: "All Utilities Incl.", value: "All utilities included (water, gas, electric, high-speed internet)", field: "utilitiesDetail" },
        { label: "Tenant Pays Electric", value: "Water and garbage covered; tenant pays electricity and gas", field: "utilitiesDetail" },
        { label: "Tenant Pays All", value: "Tenant responsible for all utilities (electric, gas, water, internet)", field: "utilitiesDetail" },
      ],
    },
    {
      id: "features",
      label: "Comfort & Amenities",
      icon: Sparkles,
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
      chips: [
        { label: "Available Immediately", value: "Available Immediately", field: "availableDate" },
        { label: "In 30 Days", value: "Available in 30 Days", field: "availableDate" },
        { label: "1st of Next Month", value: "Available 1st of Next Month", field: "availableDate" },
      ],
    },
  ];

  const saleGroups: SuggestionGroup[] = [
    {
      id: "hoa",
      label: "HOA / Condo Dues",
      icon: Building2,
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
      chips: [
        { label: "2-Car Garage", value: "2-car attached garage included", field: "parkingDetail" },
        { label: "3-Car Garage", value: "3-car garage with workshop space", field: "parkingDetail" },
        { label: "Assigned Space", value: "Assigned deeded garage space", field: "parkingDetail" },
        { label: "Driveway Parking", value: "Private driveway parking for 2+ cars", field: "parkingDetail" },
      ],
    },
    {
      id: "occupancy",
      label: "Occupancy Status",
      icon: Home,
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
      chips: [
        { label: "Remodeled Kitchen", value: "Chef kitchen remodel with quartz countertops", field: "feature" },
        { label: "New Roof (2023)", value: "Brand new architectural shingle roof (2023)", field: "feature" },
        { label: "New HVAC", value: "High-efficiency modern HVAC system installed recently", field: "feature" },
        { label: "Solar Panels", value: "Owned rooftop solar system with minimal electric bills", field: "feature" },
      ],
    },
  ];

  const groups = isRent ? rentGroups : saleGroups;

  const isChipActive = (field: string, value: any): boolean => {
    if (field === "parkingDetail") {
      return Boolean(currentValues.parkingDetail && currentValues.parkingDetail.toLowerCase().includes(value.toLowerCase().split(" ")[0]));
    }
    if (field === "petPolicyDetail") {
      return Boolean(currentValues.petPolicyDetail && currentValues.petPolicyDetail.toLowerCase().includes(value.toLowerCase().split(" ")[0]));
    }
    if (field === "utilitiesDetail") {
      return Boolean(currentValues.utilitiesDetail && currentValues.utilitiesDetail.toLowerCase().includes(value.toLowerCase().split(" ")[0]));
    }
    if (field === "hoaFeeMonthly") {
      return Number(currentValues.hoaFeeMonthly) === Number(value);
    }
    if (field === "availableDate") {
      return Boolean(currentValues.availableDate && currentValues.availableDate === value);
    }
    if (field === "feature") {
      return Boolean(currentValues.features && currentValues.features.some((f) => f.toLowerCase().includes(value.toLowerCase().slice(0, 10))));
    }
    return false;
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 border border-indigo-100 shadow-2xs">
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
          return (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Icon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.chips.map((chip) => {
                  const active = isChipActive(chip.field, chip.value);
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => onApplyChip(chip.field, chip.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer border ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs scale-102"
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
