"use client";

import { useState } from "react";
import {
  Train,
  Navigation,
  School,
  Hospital,
  Landmark,
  Map as MapIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Ruler,
  Loader2,
} from "lucide-react";
import type { HyperLocalKbData } from "@/db/schema";
import { PlaceChip } from "../hyper-local/PlaceChip";
import { LocationMapModal } from "../hyper-local/LocationMapModal";
import { findDistance } from "../hyper-local/distance-display";
import { buildMapOrigin, getMapEmbedKey } from "../hyper-local/map-embed";
import { buildDirectionsUrl, buildPlaceUrl } from "../hyper-local/maps-links";
import { SectionLabel } from "./CoreSpecsSection";

/**
 * Places listed per row before the rest fold behind a toggle. The inspector HUD shows one
 * because a map sits directly under it; this card has no inline map, so the row can breathe.
 */
const PREVIEW_COUNT = 3;

interface NearbyPlacesSectionProps {
  data: HyperLocalKbData | null;
  propertyAddress: string;
  city?: string;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * The neighbourhood layer, listed the same way the live inspector lists it - one row per
 * category, each place carrying its measured walk or drive time. The map is never drawn
 * inline here: it opens on click, so the card stays a readable list.
 */
export function NearbyPlacesSection({
  data,
  propertyAddress,
  city,
  isLoading = false,
  error,
}: NearbyPlacesSectionProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ name: string | null; mode: "walk" | "drive" } | null>(
    null
  );

  const transit = data?.transit || {};
  const neighborhood = data?.neighborhood || {};
  const questions = data?.buyerObjectionsAndPlaybook || [];

  const rows = [
    {
      key: "metro",
      icon: Train,
      label: "Metro station",
      names: transit.nearestMetro ? [transit.nearestMetro] : [],
      measurable: true,
    },
    {
      key: "highways",
      icon: Navigation,
      label: "Main roads",
      names: transit.majorHighways || [],
      measurable: false,
    },
    {
      key: "schools",
      icon: School,
      label: "Schools",
      names: neighborhood.topSchools || [],
      measurable: true,
    },
    {
      key: "hospitals",
      icon: Hospital,
      label: "Hospitals",
      names: neighborhood.topHospitals || [],
      measurable: true,
    },
    {
      key: "landmarks",
      icon: Landmark,
      label: "Landmarks",
      names: neighborhood.landmarks || [],
      measurable: false,
    },
  ].filter((row) => row.names.length > 0);

  const measuredCount = (data?.nearbyDistances || []).filter(
    (place) => place.walkMeters !== undefined || place.driveMeters !== undefined
  ).length;

  // The embedded map is free but needs its own public browser key. Without one every place
  // still reaches Google Maps, just as a keyless link in a new tab.
  const mapOrigin = propertyAddress ? buildMapOrigin(propertyAddress, city) : "";
  const embedEnabled = Boolean(mapOrigin) && Boolean(getMapEmbedKey());

  const openInGoogleMaps = (name: string | null, mode: "walk" | "drive") => {
    const place = name ? findDistance(data, name) : null;
    const url = place ? buildDirectionsUrl(mapOrigin, place, mode) : buildPlaceUrl(mapOrigin);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const showOnMap = (name: string | null, mode: "walk" | "drive" = "drive") => {
    if (embedEnabled) setMapTarget({ name, mode });
    else openInGoogleMaps(name, mode);
  };

  return (
    <section className="space-y-2.5">
      <SectionLabel
        title="Nearby places"
        note={measuredCount > 0 ? `${measuredCount} distances measured` : undefined}
        isComplete={measuredCount > 0}
      />

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Address line + the one way into the map. */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs font-semibold text-slate-600 truncate">
              {data?.resolvedLocality || propertyAddress || "Address pending"}
            </p>
          </div>
          {mapOrigin && (
            <button
              type="button"
              onClick={() => showOnMap(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {embedEnabled ? (
                <MapIcon className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>See map</span>
            </button>
          )}
        </div>

        {isLoading && !data ? (
          <div className="px-4 py-6 flex items-center gap-2.5 text-xs font-semibold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            <span>Checking the map for metro, schools and hospitals near you…</span>
          </div>
        ) : !data && error ? (
          <div className="px-4 py-5 flex items-start gap-2 text-xs font-semibold text-slate-500">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-px shrink-0" />
            <span>We could not look up nearby places this time. You can still publish without them.</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-5 text-xs font-semibold text-slate-500">
            No nearby places found for this address yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => {
              const Icon = row.icon;
              const expanded = expandedRows.includes(row.key);
              const shown = expanded ? row.names : row.names.slice(0, PREVIEW_COUNT);
              const hidden = row.names.length - PREVIEW_COUNT;

              return (
                <div key={row.key} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0 pt-0.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {row.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-w-0 flex-1">
                    {shown.map((name) =>
                      row.measurable ? (
                        <PlaceChip
                          key={name}
                          name={name}
                          data={data}
                          onViewOnMap={mapOrigin ? showOnMap : undefined}
                          isActive={embedEnabled && mapTarget?.name === name}
                          compact
                        />
                      ) : (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          {name}
                        </span>
                      )
                    )}

                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRows((keys) =>
                            expanded ? keys.filter((k) => k !== row.key) : [...keys, row.key]
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-dashed border-slate-300 text-slate-500 text-[11px] font-bold hover:border-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            {hidden} more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {(transit.commuteConnectivity || neighborhood.vibeAndLivability) && (
              <div className="px-4 py-3 space-y-1.5 bg-slate-50/60">
                {transit.commuteConnectivity && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">Getting around:</span>{" "}
                    {transit.commuteConnectivity}
                  </p>
                )}
                {neighborhood.vibeAndLivability && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">The area:</span>{" "}
                    {neighborhood.vibeAndLivability}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Distances were skipped entirely: say so rather than letting the rows read as unmeasured. */}
        {data && data.distancesMeasured === false && (
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-start gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-slate-400 mt-px shrink-0" />
            <p className="text-[11px] font-semibold text-slate-500">
              We could not measure distances this time, so places are listed without them.
            </p>
          </div>
        )}

        {/* Trust footer: was this checked against real Google Maps results, or not? */}
        {data && rows.length > 0 && (
          <div
            className={`px-4 py-2.5 border-t flex items-start gap-1.5 ${
              data.grounded ? "border-emerald-100 bg-emerald-50/50" : "border-amber-100 bg-amber-50/60"
            }`}
          >
            {data.grounded ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-px shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-px shrink-0" />
            )}
            <p
              className={`text-[11px] font-semibold ${
                data.grounded ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {data.grounded
                ? "Found on Google Maps. Tell Elena if anything here looks wrong."
                : "We could not check these on Google Maps, so please confirm them with Elena."}
            </p>
          </div>
        )}
      </div>

      {/* What buyers are likely to ask about this area, and how the sales agent answers. */}
      {questions.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="text-xs font-bold text-slate-800">
              Questions buyers may ask ({questions.length} answers ready)
            </span>
            {showQuestions ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {showQuestions && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-2.5">
              {questions.map((item, index) => (
                <div key={index} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.topic}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">
                    &ldquo;{item.likelyQuestion}&rdquo;
                  </p>
                  <p className="mt-1.5 text-xs text-slate-600 bg-white rounded-lg border border-slate-200 p-2 leading-relaxed">
                    <span className="font-semibold text-slate-800">Sarah answers:</span> &ldquo;
                    {item.voiceAgentRecommendedAnswer}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sits above the review card at z-60 and swallows its own backdrop click, so closing
          the map does not also close the review card underneath. */}
      {mapTarget && (
        <LocationMapModal
          // Remount per target: the map holds its own selection state, which would otherwise
          // stay on the previously opened place when reopened from a different chip.
          key={`${mapTarget.name ?? "property"}-${mapTarget.mode}`}
          isOpen
          onClose={() => setMapTarget(null)}
          data={data}
          propertyAddress={propertyAddress}
          city={city}
          initialPlaceName={mapTarget.name}
          initialMode={mapTarget.mode}
        />
      )}
    </section>
  );
}
