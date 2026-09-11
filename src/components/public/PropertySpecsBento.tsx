"use client";

import {
  Bed,
  Bath,
  Maximize,
  Clock,
  Layers,
  Armchair,
  CalendarCheck,
  Building,
  Coins,
  ShieldCheck,
} from "lucide-react";

export interface PropertySpecsBentoProps {
  bedrooms: number | null;
  bathrooms: string | number | null;
  washrooms?: number | null;
  sqft: number | null;
  availableDate: string | Date | null;
  floorNumber?: number | null;
  storeys?: number | null;
  furnishingStatus?: string | null;
  yearBuilt?: number | null;
  securityDeposit?: string | number | null;
  minLeaseMonths?: number | null;
  hoaFeeMonthly?: string | number | null;
  listingType: string;
}

export function PropertySpecsBento({
  bedrooms,
  bathrooms,
  washrooms,
  sqft,
  availableDate,
  floorNumber,
  storeys,
  furnishingStatus,
  yearBuilt,
  securityDeposit,
  minLeaseMonths,
  hoaFeeMonthly,
  listingType,
}: PropertySpecsBentoProps) {
  const bathValue = bathrooms ?? washrooms;

  const availabilityText = availableDate
    ? (() => {
        const d = new Date(availableDate);
        if (!isNaN(d.getTime())) {
          return `Available ${d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}`;
        }
        return `Available ${String(availableDate)}`;
      })()
    : "Available Immediately";

  const formatFloor = (floor?: number | null, total?: number | null) => {
    if (floor === undefined || floor === null) return total ? `${total} Storeys` : null;
    let floorStr = floor === 0 ? "Ground Floor" : floor < 0 ? `Basement ${Math.abs(floor)}` : `Floor ${floor}`;
    if (total) floorStr += ` of ${total}`;
    return floorStr;
  };

  const formatFurnishing = (status?: string | null) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case "bare_shell":
        return "Bare Shell";
      case "semi_furnished":
        return "Semi-Furnished";
      case "fully_furnished":
        return "Fully Furnished";
      default:
        return status.replace(/_/g, " ");
    }
  };

  const floorLabel = formatFloor(floorNumber, storeys);
  const furnishingLabel = formatFurnishing(furnishingStatus);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
      {/* Bedrooms */}
      {bedrooms !== null && bedrooms !== undefined && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Bed className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {bedrooms} {bedrooms === 1 ? "Bed" : "Beds"}
          </span>
        </div>
      )}

      {/* Bathrooms */}
      {bathValue !== null && bathValue !== undefined && bathValue !== "" && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Bath className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {bathValue} {bathValue === 1 || bathValue === "1" ? "Bath" : "Baths"}
          </span>
        </div>
      )}

      {/* Carpet Area */}
      {sqft !== null && sqft !== undefined && sqft > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Maximize className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{Number(sqft).toLocaleString("en-IN")} sqft</span>
        </div>
      )}

      {/* Availability - Full text without truncation */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/70 text-emerald-900 transition-colors whitespace-nowrap shadow-2xs">
        <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>{availabilityText}</span>
      </div>

      {/* Furnishing */}
      {furnishingLabel && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Armchair className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{furnishingLabel}</span>
        </div>
      )}

      {/* Floor Level */}
      {floorLabel && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{floorLabel}</span>
        </div>
      )}

      {/* Min Lease */}
      {listingType === "rent" && minLeaseMonths && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>{minLeaseMonths} Mo Lease</span>
        </div>
      )}

      {/* Year Built */}
      {yearBuilt && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Built {yearBuilt}</span>
        </div>
      )}

      {/* Security Deposit */}
      {securityDeposit && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Deposit ₹{Number(securityDeposit).toLocaleString("en-IN")}</span>
        </div>
      )}

      {/* HOA / Maintenance */}
      {hoaFeeMonthly && Number(hoaFeeMonthly) > 0 && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-colors whitespace-nowrap shadow-2xs">
          <Coins className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>₹{Number(hoaFeeMonthly).toLocaleString("en-IN")}/mo HOA</span>
        </div>
      )}
    </div>
  );
}
