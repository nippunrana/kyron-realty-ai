"use client";

import { Car, PawPrint, Zap } from "lucide-react";

interface ListingPoliciesCardProps {
  petPolicyDetail?: string | null;
  parkingDetail?: string | null;
  utilitiesDetail?: string | null;
}

const NOT_SPECIFIED = "Not specified by the owner.";

/** Verified building and lease policies. Missing values say so instead of inventing a policy. */
export function ListingPoliciesCard({ petPolicyDetail, parkingDetail, utilitiesDetail }: ListingPoliciesCardProps) {
  const rows = [
    {
      label: "Pet Policy",
      value: petPolicyDetail || `${NOT_SPECIFIED} Ask the voice agent to arrange a broker follow-up.`,
      icon: PawPrint,
      tone: "bg-amber-50 text-amber-600",
    },
    { label: "Parking", value: parkingDetail || NOT_SPECIFIED, icon: Car, tone: "bg-blue-50 text-blue-600" },
    { label: "Included Utilities", value: utilitiesDetail || NOT_SPECIFIED, icon: Zap, tone: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
      <h3 className="text-sm font-extrabold text-slate-900">Building &amp; Lease Policies</h3>
      {rows.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{label}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
