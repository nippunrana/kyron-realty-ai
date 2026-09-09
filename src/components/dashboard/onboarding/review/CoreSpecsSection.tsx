"use client";

import { Bed, Bath, Maximize2, CheckCircle2 } from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { getCoreSpecStatus, isStudioListing } from "../inspector-specs";

/** A detail the owner has not given yet says so. Never fill in a plausible guess. */
const PENDING = "Not given yet";

interface CoreSpecsSectionProps {
  property: ExtractedPropertyPayload["property"];
}

/**
 * The six main details, anchored by one dark card carrying the listing's identity -
 * address, price and rent-or-sale - so the eye lands there first in an otherwise light card.
 */
export function CoreSpecsSection({ property }: CoreSpecsSectionProps) {
  const isRent = property.listingType === "rent";
  const status = getCoreSpecStatus(property);
  const checkedCount = Object.values(status).filter(Boolean).length;
  const isStudio = isStudioListing(property);

  const fullAddress =
    [property.address, property.city, property.state].filter(Boolean).join(", ") || PENDING;

  const price =
    Number(property.price) > 0
      ? `₹${Number(property.price).toLocaleString("en-IN")}${isRent ? "/month" : ""}`
      : PENDING;

  const listingLabel = status.listingType ? (isRent ? "For rent" : "For sale") : PENDING;

  const cells = [
    {
      icon: Bed,
      label: "Bedrooms",
      value: status.bedrooms ? (isStudio ? "Studio" : `${property.bedrooms}`) : PENDING,
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: status.bathrooms ? `${property.bathrooms}` : PENDING,
    },
    {
      icon: Maximize2,
      label: "Size",
      value: status.sqft ? `${Number(property.sqft).toLocaleString("en-IN")} sqft` : PENDING,
    },
  ];

  return (
    <section className="space-y-2.5">
      <SectionLabel
        title="Main details"
        note={`${checkedCount} of 6 filled in`}
        isComplete={checkedCount === 6}
      />

      {/* Dark anchor: the three facts a buyer asks for first. */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Address</p>
        <p className="mt-1 text-base sm:text-lg font-bold leading-snug break-words">{fullAddress}</p>

        <div className="mt-3.5 pt-3.5 border-t border-white/10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isRent ? "Rent" : "Price"}
            </p>
            <p className="text-lg font-bold tabular-nums">{price}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Listing
            </p>
            <p className="text-lg font-bold">{listingLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cells.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** One heading style shared by every section of the review card. */
export function SectionLabel({
  title,
  note,
  isComplete = false,
}: {
  title: string;
  note?: string;
  isComplete?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {note && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            isComplete ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          {isComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
          {note}
        </span>
      )}
    </div>
  );
}
