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

interface PropertySpecsBentoProps {
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
  // Format helpers
  const spec = (value: unknown, unit: string) =>
    value === null || value === undefined || value === "" ? "Not listed" : `${value} ${unit}`;

  const availability = availableDate
    ? (() => {
        const d = new Date(availableDate);
        return !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
          : String(availableDate);
      })()
    : "Immediate";

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
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          Property Specifications & Key Facts
        </h3>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Verified Specs
        </span>
      </div>

      {/* Primary 4-Pillar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bed className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bedrooms
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate block">
              {spec(bedrooms, "Beds")}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bath className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {washrooms && !bathrooms ? "Washrooms" : "Bathrooms"}
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate block">
              {spec(bathrooms ?? washrooms, "Baths")}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Maximize className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Carpet Area
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate block">
              {spec(sqft, "sqft")}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Availability
            </span>
            <span className="text-sm font-extrabold text-slate-900 truncate block">
              {availability}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Structural & Lease Facts */}
      {(floorLabel || furnishingLabel || yearBuilt || securityDeposit || minLeaseMonths || hoaFeeMonthly) && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {floorLabel && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Floor Level
                </span>
                <span className="text-xs font-bold text-slate-800">{floorLabel}</span>
              </div>
            </div>
          )}

          {furnishingLabel && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <Armchair className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Furnishing
                </span>
                <span className="text-xs font-bold text-slate-800">{furnishingLabel}</span>
              </div>
            </div>
          )}

          {yearBuilt && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Year Built
                </span>
                <span className="text-xs font-bold text-slate-800">{yearBuilt}</span>
              </div>
            </div>
          )}

          {listingType === "rent" && minLeaseMonths && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <CalendarCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Min. Lease
                </span>
                <span className="text-xs font-bold text-slate-800">{minLeaseMonths} Months</span>
              </div>
            </div>
          )}

          {securityDeposit && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Security Deposit
                </span>
                <span className="text-xs font-bold text-slate-800">
                  ₹{Number(securityDeposit).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {hoaFeeMonthly && Number(hoaFeeMonthly) > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-2.5">
              <Coins className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  HOA / Maintenance
                </span>
                <span className="text-xs font-bold text-slate-800">
                  ₹{Number(hoaFeeMonthly).toLocaleString("en-IN")}/mo
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
