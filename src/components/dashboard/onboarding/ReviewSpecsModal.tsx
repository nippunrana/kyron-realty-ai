"use client";

import {
  CheckCircle2,
  Sparkles,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize2,
  Tag,
  ArrowRight,
  Mic,
  Loader2,
  X,
  Mail,
} from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { getCoreSpecStatus, isStudioListing } from "./inspector-specs";

interface ReviewSpecsModalProps {
  onClose: () => void;
  property: ExtractedPropertyPayload["property"];
  knowledgeBase?: ExtractedPropertyPayload["knowledgeBase"];
  contactEmail?: string;
  ownerName?: string;
  mode?: "core" | "final";
  onConfirmCore?: () => void;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
}

export function ReviewSpecsModal({
  onClose,
  property,
  knowledgeBase,
  contactEmail,
  ownerName,
  mode = "core",
  onConfirmCore,
  onPublish,
  isPublishing,
}: ReviewSpecsModalProps) {
  const isRent = property.listingType === "rent";
  const formattedPrice = Number(property.price) > 0
    ? `$${Number(property.price).toLocaleString()}${isRent ? "/mo" : ""}`
    : "Pending";

  const {
    listingType: hasValidType,
    address: hasValidAddress,
    price: hasValidPrice,
    bedrooms: hasValidBeds,
    bathrooms: hasValidBaths,
    sqft: hasValidSqft,
  } = getCoreSpecStatus(property);
  const isStudio = isStudioListing(property);

  const verifiedCoreCount = [
    hasValidType,
    hasValidAddress,
    hasValidPrice,
    hasValidBeds,
    hasValidBaths,
    hasValidSqft,
  ].filter(Boolean).length;

  const fullAddress = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ") || "Address pending";

  const isFinalMode = mode === "final";

  // Check which additional specs have been captured
  const hasParking = Boolean(knowledgeBase?.parkingDetail && knowledgeBase.parkingDetail.trim().length > 0);
  const hasPets = Boolean(knowledgeBase?.petPolicyDetail && knowledgeBase.petPolicyDetail.trim().length > 0);
  const hasUtilities = Boolean(knowledgeBase?.utilitiesDetail && knowledgeBase.utilitiesDetail.trim().length > 0);
  const hasHoa = Boolean(property.hoaFeeMonthly && Number(property.hoaFeeMonthly) > 0);
  const hasAvailableDate = Boolean(property.availableDate && property.availableDate.trim().length > 0);
  const hasFeatures = Boolean(property.features && property.features.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 shrink-0">
          <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFinalMode ? "Complete Property Intelligence Ready" : `Stage 1: Core Specs Verified (${verifiedCoreCount}/6)`}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isFinalMode ? "Final Listing Review & Deploy" : "Review Core Specifications"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
            {isFinalMode
              ? "Elena Vance has assembled your complete profile. Review both your core specs and extra details below before deploying."
              : "Elena Vance has locked in your 6 core parameters. Confirm them below to move to extra property specs."}
          </p>
        </div>

        {/* Scrollable specs body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 mb-4">
          {/* 1. HERO LOCATION SPOTLIGHT CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border border-emerald-200/90 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    Property Location & Address
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Verified primary street and municipal location
                  </p>
                </div>
              </div>
              {hasValidAddress ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 shrink-0">
                  <span>Pending</span>
                </span>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-emerald-100/70">
              <p className="text-sm font-extrabold text-slate-900 leading-snug break-words">
                {fullAddress}
              </p>
            </div>
          </div>

          {/* 2. ROW 1: FINANCIALS & CONTRACT TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Listing Type Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center border text-blue-600 bg-blue-50 border-blue-200 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Contract Type
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {isRent ? "For Rent" : property.listingType === "sale" ? "For Sale" : "Pending"}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {isRent ? "Rental" : property.listingType === "sale" ? "Sale" : "Pending"}
              </span>
            </div>

            {/* Price Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center border text-indigo-600 bg-indigo-50 border-indigo-200 shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {isRent ? "Monthly Rent" : "Asking Price"}
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {formattedPrice}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                {isRent ? "/month" : hasValidPrice ? "Asking" : "Pending"}
              </span>
            </div>
          </div>

          {/* 3. ROW 2: FLOORPLAN & SPATIAL SPECS */}
          <div className="grid grid-cols-3 gap-3">
            {/* Bedrooms */}
            <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center border text-amber-600 bg-amber-50 border-amber-200 shrink-0">
                  <Bed className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bedrooms
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                {hasValidBeds
                  ? isStudio
                    ? "Studio"
                    : `${property.bedrooms} Beds`
                  : "Pending"}
              </p>
            </div>

            {/* Bathrooms */}
            <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center border text-cyan-600 bg-cyan-50 border-cyan-200 shrink-0">
                  <Bath className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Bathrooms
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                {hasValidBaths ? `${property.bathrooms} Baths` : "Pending"}
              </p>
            </div>

            {/* Floor Area */}
            <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center border text-purple-600 bg-purple-50 border-purple-200 shrink-0">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Floor Area
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                {hasValidSqft ? `${Number(property.sqft).toLocaleString()} sqft` : "Pending"}
              </p>
            </div>
          </div>

          {/* 4. FINAL MODE: ADDITIONAL SPECS & POLICIES SUMMARY */}
          {isFinalMode && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enriched Property Knowledge Base</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  AI Sales Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Parking */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parking</span>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate">
                    {hasParking ? knowledgeBase?.parkingDetail : "Street parking / Standard"}
                  </p>
                </div>

                {/* Pets (Only relevant for rent or if specified) */}
                {isRent && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pet Policy</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                      {hasPets ? knowledgeBase?.petPolicyDetail : "Standard policy / Inquire"}
                    </p>
                  </div>
                )}

                {/* HOA (Only for sales or if specified) */}
                {!isRent && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly HOA</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                      {hasHoa ? `$${Number(property.hoaFeeMonthly).toLocaleString()}/mo` : "No HOA Fee"}
                    </p>
                  </div>
                )}

                {/* Utilities */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Utilities</span>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate">
                    {hasUtilities ? knowledgeBase?.utilitiesDetail : "Standard municipal utilities"}
                  </p>
                </div>

                {/* Move-In / Occupancy */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isRent ? "Move-In Timing" : "Occupancy Status"}
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5 truncate">
                    {hasAvailableDate ? property.availableDate : "Available Immediately"}
                  </p>
                </div>
              </div>

              {/* Features badges */}
              {hasFeatures && (
                <div className="pt-2 border-t border-indigo-100 flex flex-wrap gap-1.5">
                  {property.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2 py-0.5 rounded-md bg-white border border-indigo-100 text-indigo-900 text-[10px] font-semibold"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Listing Contact Spotlight */}
          {contactEmail && (
            <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center border text-blue-600 bg-blue-50 border-blue-200 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Public Contact Email
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 truncate block">
                    {contactEmail} {ownerName ? `(${ownerName})` : ""}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>Verified</span>
              </span>
            </div>
          )}

          {/* Live Voice Corrections Active Banner */}
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-3 h-3 animate-pulse" />
            </div>
            <div className="flex-1 leading-relaxed text-[11px]">
              <span className="font-bold">Live voice corrections active:</span> Speak naturally to Elena to modify details (e.g. <span className="font-semibold italic">“Actually change the price to $4,000”</span>) and this card updates live.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 pt-2 border-t border-slate-100">
          {!isFinalMode ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-xs font-bold text-slate-700 transition-all text-center cursor-pointer"
              >
                Adjust with Elena
              </button>

              <button
                type="button"
                onClick={onConfirmCore}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01]"
              >
                <span>Confirm & Add Extra Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-xs font-bold text-slate-700 transition-all text-center cursor-pointer"
              >
                Back to Inspector
              </button>

              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying 24/7 Voice Sales Agent...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Deploy 24/7 Voice Sales Agent</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

