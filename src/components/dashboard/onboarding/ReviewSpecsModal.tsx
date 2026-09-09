"use client";

import { X, ArrowRight, Loader2, Mic, Mail, CheckCircle2, Sparkles } from "lucide-react";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import type { HyperLocalKbData } from "@/db/schema";
import { ModalMuteButton } from "./ModalMuteButton";
import { CoreSpecsSection, SectionLabel } from "./review/CoreSpecsSection";
import { ExtraSpecsSection } from "./review/ExtraSpecsSection";
import { NearbyPlacesSection } from "./review/NearbyPlacesSection";

interface ReviewSpecsModalProps {
  onClose: () => void;
  property: ExtractedPropertyPayload["property"];
  knowledgeBase?: ExtractedPropertyPayload["knowledgeBase"];
  contactEmail?: string;
  ownerName?: string;
  mode?: "core" | "additional" | "final";
  onConfirmCore?: () => void;
  onProceedToUpload?: () => void;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
  isCallActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  /** Neighbourhood layer. Absent while the map search is still running. */
  hyperLocalData?: HyperLocalKbData | null;
  isEnrichingLocation?: boolean;
  enrichmentError?: string | null;
}

const COPY = {
  core: {
    step: "Step 1 of 2",
    title: "Check your main details",
    subtitle:
      "Elena has the main details of your property. Check them, then move on to the extra details.",
  },
  additional: {
    step: "Step 2 of 2",
    title: "Check your full listing",
    subtitle:
      "Everything Elena has so far — your main details, the extra details, and the places near your home.",
  },
  final: {
    step: "Ready to go live",
    title: "Last check before you go live",
    subtitle:
      "This is your whole listing. Check it, then deploy your 24/7 voice sales agent.",
  },
} as const;

/**
 * The one review card. `core` shows the main details on their own; `additional` and
 * `final` show the whole listing - main details, extra details and nearby places - so the
 * owner reviews everything in one window instead of three.
 */
export function ReviewSpecsModal({
  onClose,
  property,
  knowledgeBase,
  contactEmail,
  ownerName,
  mode = "core",
  onConfirmCore,
  onProceedToUpload,
  onPublish,
  isPublishing,
  isCallActive,
  isMuted = false,
  onToggleMute,
  hyperLocalData = null,
  isEnrichingLocation = false,
  enrichmentError,
}: ReviewSpecsModalProps) {
  const isCoreMode = mode === "core";
  const isFinalMode = mode === "final";
  const copy = COPY[mode];
  const images = Array.isArray(property.images) ? property.images : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-specs-title"
        className="bg-slate-50 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 text-slate-900 max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 bg-white border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {isFinalMode ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              )}
              {copy.step}
            </span>
            <h2
              id="review-specs-title"
              className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
            >
              {copy.title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{copy.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCallActive && onToggleMute && (
              <ModalMuteButton isMuted={isMuted} onToggleMute={onToggleMute} />
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
          <CoreSpecsSection property={property} />

          {!isCoreMode && (
            <>
              <ExtraSpecsSection property={property} knowledgeBase={knowledgeBase} />
              <NearbyPlacesSection
                data={hyperLocalData}
                propertyAddress={property.address}
                city={property.city || undefined}
                isLoading={isEnrichingLocation}
                error={enrichmentError}
              />
            </>
          )}

          {images.length > 0 && (
            <section className="space-y-2.5">
              <SectionLabel title="Photos" note={`${images.length} attached`} isComplete />
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.slice(0, 6).map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shrink-0 relative"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="Property photo" className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-white text-center">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  {images.length > 6 && (
                    <div className="w-20 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      +{images.length - 6}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {contactEmail && (
            <section className="space-y-2.5">
              <SectionLabel title="Contact" />
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Buyers will write to
                  </p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {contactEmail}
                    {ownerName ? ` (${ownerName})` : ""}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* One voice hint for the whole card. */}
          <div className="rounded-2xl bg-white border border-slate-200 p-3.5 flex items-start gap-2.5">
            <Mic className="w-3.5 h-3.5 text-slate-500 animate-pulse mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">Just say it out loud.</span> Tell Elena
              what to change — &ldquo;change the rent to ₹95,000&rdquo; or &ldquo;the metro is
              Sector 28&rdquo; — and this card updates while you talk.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 shrink-0">
          {isFinalMode ? (
            <>
              {onProceedToUpload && (
                <button
                  type="button"
                  onClick={onProceedToUpload}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Change photos
                </button>
              )}
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up your voice sales agent…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Deploy 24/7 Voice Sales Agent</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Change something
              </button>
              <button
                type="button"
                onClick={isCoreMode ? onConfirmCore : onProceedToUpload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isCoreMode ? "Looks good — add extra details" : "All done — add photos"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
