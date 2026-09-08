"use client";

import { useState } from "react";
import type { HyperLocalKbData } from "@/db/schema";
import {
  Train,
  Navigation,
  School,
  Hospital,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Radio,
  MapPin,
  Footprints,
  Car,
  Map as MapIcon,
  ExternalLink,
} from "lucide-react";
import { distancePills, findDistance } from "./distance-display";
import { PlaceChip } from "./PlaceChip";
import { LocationMapModal, getMapEmbedKey } from "./LocationMapModal";
import { buildDirectionsUrl, buildPlaceUrl } from "./maps-links";

interface HyperLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: HyperLocalKbData | null;
  propertyAddress: string;
  city?: string;
  isLoading?: boolean;
}

export function HyperLocalModal({
  isOpen,
  onClose,
  onConfirm,
  data,
  propertyAddress,
  city,
  isLoading = false,
}: HyperLocalModalProps) {
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapPlace, setMapPlace] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"walk" | "drive">("drive");

  if (!isOpen) return null;

  const transit = data?.transit || {};
  const neighborhood = data?.neighborhood || {};
  const objections = data?.buyerObjectionsAndPlaybook || [];

  // The map is free and unlimited, but needs its own public browser key; without one the
  // affordance is hidden rather than rendering a broken frame.
  const mapEnabled = Boolean(getMapEmbedKey());
  const mapOrigin = [propertyAddress, city, "India"].filter(Boolean).join(", ");

  /** Keyless fallback: always available, even with no embed key configured. */
  const openInGoogleMaps = (name: string | null, mode: "walk" | "drive" = "drive") => {
    const place = name ? findDistance(data, name) : null;
    const url = place ? buildDirectionsUrl(mapOrigin, place, mode) : buildPlaceUrl(mapOrigin);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const openMap = (name: string | null, mode: "walk" | "drive" = "drive") => {
    setMapPlace(name);
    setMapMode(mode);
    setMapOpen(true);
  };
  const viewOnMap = mapEnabled ? openMap : openInGoogleMaps;

  const metroPills = distancePills(findDistance(data, transit.nearestMetro || ""));
  const measuredCount = (data?.nearbyDistances || []).filter(
    (p) => p.walkMeters !== undefined || p.driveMeters !== undefined
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hyperlocal-modal-title"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="hyperlocal-modal-title" className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  AI Hyper-Local & Transit Intelligence
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wide uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Map Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate max-w-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{propertyAddress}{city ? `, ${city}` : ""}</span>
              </p>
            </div>
          </div>

          {/* Voice Listening Active Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Elena Listening</span>
            <Radio className="w-3 h-3 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {mapEnabled && (
              <button
                type="button"
                onClick={() => openMap(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 border border-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Show Map Here</span>
              </button>
            )}
            {/* Keyless, so this is offered whether or not an embed key exists. */}
            <button
              type="button"
              onClick={() => openInGoogleMaps(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:border-blue-300 hover:text-blue-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Google Maps</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-700">
                Checking the map for transit, schools, and neighborhood details...
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Analyzing geographic connectivity and compiling objection-handling scripts.
              </p>
            </div>
          ) : (
            <>
              {/* Voice-First Instructional Prompt Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">Voice-First Studio:</span> Elena Vance has identified these neighborhood details.
                  Speak naturally to correct any detail (e.g. <em>&ldquo;The metro is Sector 28&rdquo;</em>), or say{" "}
                  <em>&ldquo;Looks good, proceed&rdquo;</em> to move to photo upload.
                </div>
              </div>

              {/* Resolved locality and measurement summary */}
              {(data?.resolvedLocality || measuredCount > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  {data?.resolvedLocality && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {data.resolvedLocality}
                      {data.locationConfidence && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {data.locationConfidence} confidence
                        </span>
                      )}
                    </span>
                  )}
                  {measuredCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {measuredCount} distances measured
                    </span>
                  )}
                </div>
              )}

              {/* 1. Metro & Highway Transit Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Train className="w-4 h-4 text-blue-600" />
                  <span>Transit & Highway Connectivity</span>
                </div>

                {transit.nearestMetro ? (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Nearest Metro Station
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {transit.nearestMetro}
                      </div>
                      {metroPills.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {metroPills.map((pill) => {
                            const Icon = pill.mode === "walk" ? Footprints : Car;
                            const cls = `inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${
                              pill.mode === "walk"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`;
                            // Inline map when an embed key exists, otherwise the keyless tab.
                            return (
                              <button
                                key={pill.mode}
                                type="button"
                                onClick={() => viewOnMap(transit.nearestMetro || null, pill.mode)}
                                className={`${cls} hover:brightness-95`}
                              >
                                <Icon className="w-3 h-3" />
                                {pill.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No metro station identified.</div>
                )}

                {transit.majorHighways && transit.majorHighways.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Corridors & Highways
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {transit.majorHighways.map((hw, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                        >
                          {hw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {transit.commuteConnectivity && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="font-semibold text-slate-800">Commute Context:</span> {transit.commuteConnectivity}
                  </p>
                )}
              </div>

              {/* 2. Schools, Hospitals & Landmarks */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Neighborhood Amenities & Social Infrastructure</span>
                </div>

                {/* Schools */}
                {neighborhood.topSchools && neighborhood.topSchools.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Top Recognized Schools</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {neighborhood.topSchools.map((sch, i) => (
                        <PlaceChip key={i} name={sch} data={data} onViewOnMap={viewOnMap} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Hospitals */}
                {neighborhood.topHospitals && neighborhood.topHospitals.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Hospital className="w-3.5 h-3.5 text-rose-600" />
                      <span>Leading Hospitals Nearby</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {neighborhood.topHospitals.map((hosp, i) => (
                        <PlaceChip key={i} name={hosp} data={data} onViewOnMap={viewOnMap} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Landmarks */}
                {neighborhood.landmarks && neighborhood.landmarks.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Prominent Landmarks & Commercial Hubs</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {neighborhood.landmarks.map((lm, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium"
                        >
                          {lm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vibe */}
                {neighborhood.vibeAndLivability && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="font-semibold text-slate-800">Area Vibe:</span> {neighborhood.vibeAndLivability}
                  </p>
                )}
              </div>

              {/* 3. Objection-Handling Playbook (Collapsible) */}
              {objections.length > 0 && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setShowPlaybook(!showPlaybook)}
                    className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Sarah&apos;s Voice Objection Playbook ({objections.length} Pre-Trained Answers)
                      </span>
                    </div>
                    {showPlaybook ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showPlaybook && (
                    <div className="p-4 pt-0 border-t border-slate-100 space-y-3">
                      {objections.map((obj, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            {obj.topic}
                          </div>
                          <div className="text-xs font-semibold text-slate-800">
                            &ldquo;{obj.likelyQuestion}&rdquo;
                          </div>
                          <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                            <span className="font-semibold text-emerald-700">Sarah replies:</span> &ldquo;{obj.voiceAgentRecommendedAnswer}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Minimize Card
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <span>Confirm & Proceed to Photos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layers above this card at z-60 and swallows its own backdrop click, so dismissing
          the map does not also dismiss the review card underneath. */}
      <LocationMapModal
        // Remount per target: the map holds its own selection state, which would otherwise
        // stay on the previously opened place when the card is reopened from a new pill.
        key={`${mapPlace ?? "property"}-${mapMode}`}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        data={data}
        propertyAddress={propertyAddress}
        city={city}
        initialPlaceName={mapPlace}
        initialMode={mapMode}
      />
    </div>
  );
}
