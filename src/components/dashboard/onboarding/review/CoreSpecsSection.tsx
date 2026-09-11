"use client";

import { Bed, Bath, Maximize2, CheckCircle2, Building2, Sofa } from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { getCoreSpecRows, getCoreSpecStatus, isStudioListing } from "../inspector-specs";
import {
  describePropertyType,
  formatCompositeAddress,
  FURNISHING_LABELS,
  type FurnishingStatus,
} from "@/lib/property-types";

/** A detail the owner has not given yet says so. Never fill in a plausible guess. */
const PENDING = "Not given yet";

interface CoreSpecsSectionProps {
  property: ExtractedPropertyPayload["property"];
  knowledgeBase?: ExtractedPropertyPayload["knowledgeBase"];
}

/**
 * The seven main details, anchored by one dark card carrying the listing's identity -
 * address, price and rent-or-sale - so the eye lands there first in an otherwise light card.
 */
export function CoreSpecsSection({ property, knowledgeBase }: CoreSpecsSectionProps) {
  const isRent = property.listingType === "rent";
  const status = getCoreSpecStatus(property, knowledgeBase);
  const rows = getCoreSpecRows(property, knowledgeBase);
  const checkedCount = rows.filter((key) => status[key]).length;
  const isStudio = isStudioListing(property);
  // Same decision the checklist made, so the card can never disagree with it.
  const commercial = rows.includes("washrooms");

  const fullAddress = formatCompositeAddress(property) || PENDING;

  const price =
    Number(property.price) > 0
      ? `₹${Number(property.price).toLocaleString("en-IN")}${isRent ? "/month" : ""}`
      : PENDING;

  const listingLabel = status.listingType ? (isRent ? "For rent" : "For sale") : PENDING;

  const typeLabel = describePropertyType(property) || PENDING;

  const cells = commercial
    ? [
        {
          key: "washrooms",
          icon: Bath,
          label: "Washrooms",
          value: status.washrooms
            ? knowledgeBase?.washroomDetail
              ? knowledgeBase.washroomDetail
              : property.washrooms === 0
              ? "Tower / Common"
              : `${property.washrooms} Washroom${property.washrooms === 1 ? "" : "s"}`
            : PENDING,
        },
        {
          key: "furnishingStatus",
          icon: Sofa,
          label: "Furnishing",
          value: property.furnishingStatus
            ? FURNISHING_LABELS[property.furnishingStatus as Exclude<FurnishingStatus, "">]
            : PENDING,
        },
        {
          key: "sqft",
          icon: Maximize2,
          label: "Carpet area",
          value: status.sqft ? `${Number(property.sqft).toLocaleString("en-IN")} sqft` : PENDING,
        },
      ]
    : [
        {
          key: "bedrooms",
          icon: Bed,
          label: "Bedrooms",
          value: status.bedrooms ? (isStudio ? "Studio" : `${property.bedrooms}`) : PENDING,
        },
        {
          key: "bathrooms",
          icon: Bath,
          label: "Bathrooms",
          value: status.bathrooms ? `${property.bathrooms}` : PENDING,
        },
        {
          key: "sqft",
          icon: Maximize2,
          label: "Size",
          value: status.sqft ? `${Number(property.sqft).toLocaleString("en-IN")} sqft` : PENDING,
        },
      ];

  return (
    <section className="space-y-2.5">
      <SectionLabel
        title="Main details"
        note={`${checkedCount} of ${rows.length} filled in`}
        isComplete={checkedCount === rows.length}
      />

      {/* Dark anchor: the three facts a buyer asks for first. */}
      <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5">
        <div data-review-spec="address" className="rounded-xl p-1 -m-1 transition-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Address</p>
          <p data-review-value="address" className="mt-1 text-base sm:text-lg font-bold leading-snug break-words">{fullAddress}</p>
        </div>

        <div className="mt-3.5 pt-3.5 border-t border-white/10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <div data-review-spec="price" className="rounded-xl p-1 -m-1 transition-shadow">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isRent ? "Rent" : "Price"}
            </p>
            <p data-review-value="price" className="text-lg font-bold tabular-nums">{price}</p>
          </div>
          <div data-review-spec="listingType" className="rounded-xl p-1 -m-1 transition-shadow">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Listing
            </p>
            <p data-review-value="listingType" className="text-lg font-bold">{listingLabel}</p>
          </div>
          <div data-review-spec="propertyType" className="min-w-0 rounded-xl p-1 -m-1 transition-shadow">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              Property type
            </p>
            <p data-review-value="propertyType" className="text-lg font-bold break-words">{typeLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cells.map(({ key, icon: Icon, label, value }) => (
          <div
            key={label}
            data-review-spec={key}
            className="rounded-2xl border border-slate-200 bg-white p-3.5"
          >
            <div className="flex items-center gap-1.5 text-slate-400">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <p data-review-value={key} className="mt-1.5 text-sm font-bold text-slate-900">{value}</p>
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
