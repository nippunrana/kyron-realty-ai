"use client";

import { useState } from "react";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Scale,
  PawPrint,
  Car,
  Zap,
  Lock,
  Clock,
  CheckCircle2,
  Layers,
  Eye,
  Mail,
} from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { VerificationChecklist } from "./VerificationChecklist";
import { buildAdditionalSpecs, buildChecklistItems } from "./inspector-specs";
import { ExtraSpecsSuggestionBar } from "./ExtraSpecsSuggestionBar";

interface LivePropertyInspectorProps {
  data: ExtractedPropertyPayload;
  ownerName?: string;
  onboardingStage?: "core" | "additional_specs" | "final_review";
  onUpdateProperty: (updates: Partial<ExtractedPropertyPayload["property"]>) => void;
  onUpdateKnowledgeBase: (updates: Partial<ExtractedPropertyPayload["knowledgeBase"]>) => void;
  onPublish: () => void;
  /** Opens the review card for the current stage: core specs, or final review once core is confirmed. */
  onOpenReviewModal?: () => void;
  /** Re-opens the confirmed core specs from a later stage. */
  onOpenCoreModal?: () => void;
  isPublishing: boolean;
  isExtracting: boolean;
  isTurnSyncing?: boolean;
}

export function LivePropertyInspector({
  data,
  ownerName,
  onboardingStage = "core",
  onUpdateProperty,
  onUpdateKnowledgeBase,
  onPublish,
  onOpenReviewModal,
  onOpenCoreModal,
  isPublishing,
  isExtracting,
  isTurnSyncing = false,
}: LivePropertyInspectorProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const { property, knowledgeBase, negotiationMatrix } = data;
  const hasImages = Boolean(
    (property.images && property.images.length > 0) || property.coverImageUrl
  );
  const images = hasImages
    ? property.images && property.images.length > 0
      ? property.images
      : [property.coverImageUrl!]
    : [];
  const currentImage = images[activeImageIdx] || images[0];

  const checklistItems = buildChecklistItems(property);
  const verifiedCount = checklistItems.filter((item) => item.isComplete).length;
  const isFullyVerified = verifiedCount === 6;
  const additionalSpecs = buildAdditionalSpecs(property, knowledgeBase);

  const handleApplyChip = (field: string, value: any) => {
    if (field === "parkingDetail" || field === "petPolicyDetail" || field === "utilitiesDetail") {
      onUpdateKnowledgeBase({ [field]: value });
    } else if (field === "hoaFeeMonthly") {
      onUpdateProperty({ hoaFeeMonthly: Number(value) });
    } else if (field === "availableDate") {
      onUpdateProperty({ availableDate: value });
    } else if (field === "feature") {
      const existing = property.features || [];
      if (!existing.includes(value)) {
        onUpdateProperty({ features: [...existing, value] });
      }
    }
  };

  const hasAnyIntelligence = Boolean(
    knowledgeBase.synthesizedSalesPitch ||
      (property.amenities && property.amenities.length > 0) ||
      knowledgeBase.petPolicyDetail ||
      knowledgeBase.parkingDetail ||
      knowledgeBase.utilitiesDetail ||
      negotiationMatrix.minFloorPrice > 0 ||
      (knowledgeBase.faqs && knowledgeBase.faqs.length > 0)
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden relative text-slate-900">
      {/* Extraction Overlay Spinner if AI is parsing */}
      {isExtracting && (
        <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 animate-bounce">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Synthesizing Property Intelligence...
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Extracting core specs, voice sales pitch, and guardrails
          </p>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isFullyVerified
                ? "bg-emerald-500 animate-pulse"
                : verifiedCount > 0 || additionalSpecs.length > 0
                ? "bg-blue-500 animate-pulse"
                : "bg-slate-300"
            }`}
          />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Property Inspector
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isTurnSyncing && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 animate-pulse">
              <Sparkles className="w-3 h-3 text-blue-600 animate-spin" />
              <span>Syncing specs...</span>
            </div>
          )}
          {isFullyVerified && onOpenReviewModal ? (
            <div className="flex items-center gap-1.5">
              {onOpenCoreModal && onboardingStage !== "core" && (
                <button
                  type="button"
                  onClick={onOpenCoreModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>Core Specs</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-emerald-700 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {onboardingStage === "additional_specs" || onboardingStage === "final_review"
                    ? "Review & Deploy"
                    : "Review Card"}
                </span>
              </button>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-colors ${
                isFullyVerified
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFullyVerified ? "6/6 Verified" : `${verifiedCount}/6 Verified`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Scrollable Inspector Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Photo Gallery Hero OR Architectural Blueprint Waiting Card */}
        {hasImages ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-16/9 group border border-slate-200/80 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={property.title || "Property Listing"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20 pointer-events-none" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                {property.listingType === "rent"
                  ? "For Rent"
                  : property.listingType === "sale"
                  ? "For Sale"
                  : "Type Pending"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                {property.propertyType || "Property"}
              </span>
            </div>

            {/* Bottom Title & Address */}
            <div className="absolute bottom-3 inset-x-3 text-white">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {property.address
                    ? `${property.address}, ${property.city || ""} ${property.state || ""} ${property.zipCode || ""}`
                    : "Address pending extraction"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight leading-snug line-clamp-1">
                {property.title || "Discovered Property"}
              </h3>
            </div>
          </div>
        ) : (
          /* Architectural Blueprint State */
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 aspect-16/9 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-2.5">
              <Building2 className="w-6 h-6 stroke-[1.5]" />
            </div>

            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
              {verifiedCount > 0 || additionalSpecs.length > 0
                ? `${property.title || "Discovered Listing in Progress"}`
                : "Awaiting property details..."}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              {verifiedCount > 0 || additionalSpecs.length > 0
                ? "Parameters are dynamically populating in real time as Elena Vance listens."
                : "Speak with Elena Vance on the left or paste a listing URL to automatically extract property specs in real time."}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Live Extraction Stream</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                <span>{verifiedCount}/6 Attributes Verified</span>
              </span>
            </div>
          </div>
        )}

        {/* Thumbnail Selector (if images exist) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.slice(0, 6).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative w-14 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  activeImageIdx === idx
                    ? "border-blue-600 shadow-sm"
                    : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Verified Listing Contact Card */}
        {knowledgeBase.contactEmail && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-white to-slate-50 border border-blue-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
                    Verified Listing Contact
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                    Connected
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {knowledgeBase.contactEmail} {ownerName ? `• ${ownerName}` : ""}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 shrink-0 hidden sm:inline">
              Public Inquiry Email
            </span>
          </div>
        )}

        {/* 6-Point Dynamic Verification Checklist */}
        <VerificationChecklist items={checklistItems} verifiedCount={verifiedCount} />

        {/* Suggestion Chips Bar for Extra Specs */}
        {(isFullyVerified || onboardingStage === "additional_specs" || onboardingStage === "final_review" || additionalSpecs.length > 0) && (
          <ExtraSpecsSuggestionBar
            listingType={property.listingType === "sale" ? "sale" : "rent"}
            currentValues={{
              parkingDetail: knowledgeBase.parkingDetail,
              petPolicyDetail: knowledgeBase.petPolicyDetail,
              utilitiesDetail: knowledgeBase.utilitiesDetail,
              hoaFeeMonthly: Number(property.hoaFeeMonthly) || 0,
              availableDate: property.availableDate,
              features: property.features,
            }}
            onApplyChip={handleApplyChip}
          />
        )}

        {/* SECTION 1: ADDITIONAL PROPERTY SPECS (Dynamically revealed) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Additional Specs ({additionalSpecs.length})</span>
            </span>
            {additionalSpecs.length > 0 && (
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Active Parameters
              </span>
            )}
          </div>

          {additionalSpecs.length === 0 ? (
            /* Subtle placeholder when no additional parameters discovered yet */
            <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-600">
                No additional specs recorded yet
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Secondary details (Year Built, HOA, deposit, lease terms, unit #) will appear here as they are mentioned to Elena Vance.
              </p>
            </div>
          ) : (
            /* Dynamic Parameter Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {additionalSpecs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.id}
                    className="p-3 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {spec.label}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 truncate block">
                          {spec.value}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Saved</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: SYNTHESIZED INTELLIGENCE (Dynamically revealed) */}
        {hasAnyIntelligence && (
          <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Synthesized Voice Intelligence
            </span>

            {/* Spoken Sales Pitch */}
            {knowledgeBase.synthesizedSalesPitch && (
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-blue-900">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Elena&apos;s Spoken Elevator Pitch</span>
                </div>
                <p className="text-xs text-blue-950 font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  &ldquo;{knowledgeBase.synthesizedSalesPitch}&rdquo;
                </p>
              </div>
            )}

            {/* Discovered Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  Discovered Amenities ({property.amenities.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-medium shadow-2xs"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Policies & Guardrails */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {knowledgeBase.petPolicyDetail && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-700 mb-0.5">
                    <PawPrint className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pet Policy</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{knowledgeBase.petPolicyDetail}</p>
                </div>
              )}

              {knowledgeBase.parkingDetail && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-700 mb-0.5">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Parking</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{knowledgeBase.parkingDetail}</p>
                </div>
              )}

              {knowledgeBase.utilitiesDetail && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 font-bold text-slate-700 mb-0.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Utilities</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{knowledgeBase.utilitiesDetail}</p>
                </div>
              )}
            </div>

            {/* Concession Floor Price Lock */}
            {negotiationMatrix.minFloorPrice > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-700" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Autonomous Price Floor Lock
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Elena will not accept any offer below this floor
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-950 bg-white border border-amber-200 px-2.5 py-1 rounded-lg">
                  ${Number(negotiationMatrix.minFloorPrice).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
        {isFullyVerified ? (
          <div className="flex items-center gap-2">
            {onOpenReviewModal && (
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-sm border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Review Card</span>
              </button>
            )}
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isPublishing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Deploying 24/7 Voice Sales Agent...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish & Deploy</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={true}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 border border-slate-200/90 text-slate-400 font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Publish Listing & Deploy AI Voice Agent</span>
          </button>
        )}

        <p className="text-[11px] text-center mt-2 flex items-center justify-center gap-1.5">
          {isFullyVerified ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">
                6/6 Attributes Verified • Ready to deploy with Elena Vance
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">
                Complete 6 verification attributes to deploy ({verifiedCount}/6 verified)
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
