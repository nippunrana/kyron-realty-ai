"use client";

import { Building2, Layers, Home, KeyRound, Sofa, Bath, Check } from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import {
  COMMERCIAL_TYPES,
  FURNISHING_LABELS,
  formatFloor,
  getMissingTypeSlot,
  isCommercial,
  PROPERTY_TYPE_LABELS,
  RENT_SCOPE_LABELS,
  RESIDENTIAL_TYPES,
} from "@/lib/property-types";

type Property = ExtractedPropertyPayload["property"];
type KnowledgeBase = ExtractedPropertyPayload["knowledgeBase"];

interface CoreChip {
  label: string;
  field: "propertyType" | "floorNumber" | "storeys" | "rentScope" | "furnishingStatus" | "washrooms" | "washroomDetail";
  value: string | number;
}

interface CoreGroup {
  id: string;
  label: string;
  icon: typeof Building2;
  chips: CoreChip[];
}

const FLOOR_CHOICES = [-1, 0, 1, 2, 3, 4, 5];
const STOREY_CHOICES = [1, 2, 3];

interface CoreSpecsSuggestionBarProps {
  property: Property;
  knowledgeBase?: KnowledgeBase;
  onApplyChip: (field: string, value: string | number) => void;
}

/**
 * Tap-or-speak answers for the property-type row. A floor number is a tap rather than a
 * sentence, which also keeps speech-to-text away from the digits it most often mishears.
 *
 * Only the groups this property's type actually needs are rendered, so a flat owner is
 * never shown a storeys row and a seller is never shown the rent-scope row.
 */
export function CoreSpecsSuggestionBar({ property, knowledgeBase, onApplyChip }: CoreSpecsSuggestionBarProps) {
  const commercial = isCommercial(property.propertyType);
  const missingSlot = getMissingTypeSlot(property);

  const groups: CoreGroup[] = [
    {
      id: "type",
      label: "Property Type",
      icon: Building2,
      chips: [...RESIDENTIAL_TYPES, ...COMMERCIAL_TYPES].map((t) => ({
        label: PROPERTY_TYPE_LABELS[t],
        field: "propertyType" as const,
        value: t,
      })),
    },
  ];

  if (missingSlot === "floor" || property.floorNumber !== null) {
    groups.push({
      id: "floor",
      label: "Which Floor",
      icon: Layers,
      chips: FLOOR_CHOICES.map((f) => ({
        label: formatFloor(f),
        field: "floorNumber" as const,
        value: f,
      })),
    });
  }

  if (missingSlot === "storeys" || (property.storeys ?? 0) > 0) {
    groups.push({
      id: "storeys",
      label: "How Many Storeys",
      icon: Home,
      chips: STOREY_CHOICES.map((n) => ({
        label: n === 1 ? "Single storey" : n === 2 ? "Double storey" : `${n} storeys`,
        field: "storeys" as const,
        value: n,
      })),
    });
  }

  // Only a multi-storey house let for rent leaves the rent figure ambiguous.
  if (missingSlot === "rentScope" || (property.rentScope && property.listingType === "rent")) {
    groups.push({
      id: "rent_scope",
      label: "What The Rent Covers",
      icon: KeyRound,
      chips: (["whole_property", "single_floor"] as const).map((v) => ({
        label: RENT_SCOPE_LABELS[v],
        field: "rentScope" as const,
        value: v,
      })),
    });
  }

  if (commercial) {
    groups.push({
      id: "furnishing",
      label: "Furnishing",
      icon: Sofa,
      chips: (["bare_shell", "semi_furnished", "fully_furnished"] as const).map((v) => ({
        label: FURNISHING_LABELS[v],
        field: "furnishingStatus" as const,
        value: v,
      })),
    });

    groups.push({
      id: "washrooms",
      label: "Washrooms",
      icon: Bath,
      chips: [
        { label: "Tower Provided", field: "washroomDetail", value: "Provided by the tower" },
        { label: "1 Washroom", field: "washrooms", value: 1 },
        { label: "2 Washrooms", field: "washrooms", value: 2 },
        { label: "3+ Washrooms", field: "washrooms", value: 3 },
      ],
    });
  }

  const isChipActive = (chip: CoreChip): boolean => {
    switch (chip.field) {
      case "propertyType":
        return property.propertyType === chip.value;
      case "floorNumber":
        return property.floorNumber === chip.value;
      case "storeys":
        return property.storeys === chip.value;
      case "rentScope":
        return property.rentScope === chip.value;
      case "furnishingStatus":
        return property.furnishingStatus === chip.value;
      case "washroomDetail":
        return knowledgeBase?.washroomDetail === chip.value;
      case "washrooms":
        return property.washrooms === chip.value;
    }
  };

  return (
    <div
      id="core-specs-suggestion-bar"
      className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 border border-blue-100 shadow-2xs transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block leading-none">
              What Kind Of Property Is It?
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Tap to apply, or just tell Elena Vance out loud
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          Core Detail
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.id} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {group.chips.map((chip) => {
                  const active = isChipActive(chip);
                  return (
                    <button
                      key={`${chip.field}-${chip.value}`}
                      type="button"
                      onClick={() => onApplyChip(chip.field, chip.value)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer border ${
                        active
                          ? "bg-blue-600 text-white border-blue-700 shadow-2xs font-bold scale-102"
                          : "bg-white text-slate-700 hover:text-blue-900 hover:bg-blue-50/70 border-slate-200/90 hover:border-blue-300"
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
