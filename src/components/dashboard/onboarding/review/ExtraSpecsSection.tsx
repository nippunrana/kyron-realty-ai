"use client";

import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { SectionLabel } from "./CoreSpecsSection";

/** A detail the owner has not given yet says so. Never fill in a plausible guess. */
const NOT_SPECIFIED = "Not specified";

interface ExtraSpecsSectionProps {
  property: ExtractedPropertyPayload["property"];
  knowledgeBase?: ExtractedPropertyPayload["knowledgeBase"];
}

function value(detail: string | null | undefined): string {
  return detail && detail.trim().length > 0 ? detail : NOT_SPECIFIED;
}

/**
 * The second round of questions Elena asks. Rent and sale ask different things, so the
 * pets / maintenance-fee cell swaps rather than showing both with one blank.
 */
export function ExtraSpecsSection({ property, knowledgeBase }: ExtraSpecsSectionProps) {
  const isRent = property.listingType === "rent";
  const hasHoa = Boolean(property.hoaFeeMonthly && Number(property.hoaFeeMonthly) > 0);
  const features = property.features || [];

  const cells: Array<{ label: string; value: string }> = [
    { label: "Parking", value: value(knowledgeBase?.parkingDetail) },
    isRent
      ? { label: "Pets", value: value(knowledgeBase?.petPolicyDetail) }
      : {
          label: "Maintenance fee",
          value: hasHoa
            ? `₹${Number(property.hoaFeeMonthly).toLocaleString("en-IN")}/month`
            : NOT_SPECIFIED,
        },
    { label: "Utilities", value: value(knowledgeBase?.utilitiesDetail) },
    {
      label: isRent ? "Move-in from" : "Occupancy",
      value: value(property.availableDate),
    },
  ];

  const filledCount = cells.filter((c) => c.value !== NOT_SPECIFIED).length;

  return (
    <section className="space-y-2.5">
      <SectionLabel
        title="Extra details"
        note={`${filledCount} of ${cells.length} filled in`}
        isComplete={filledCount === cells.length}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {cells.map((cell) => (
          <div key={cell.label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {cell.label}
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                cell.value === NOT_SPECIFIED ? "text-slate-400" : "text-slate-900"
              }`}
            >
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {features.map((feature) => (
            <span
              key={feature}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
            >
              {feature}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
