"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Train,
  Navigation,
  School,
  Hospital,
  Satellite,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
  ShieldCheck,
  Ruler,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { HyperLocalKbData } from "@/db/schema";
import { PlaceChip } from "./PlaceChip";
import { InlineLocationMap } from "./InlineLocationMap";
import { findDistance } from "./distance-display";
import { buildMapOrigin, getMapEmbedKey } from "./map-embed";
import { buildDirectionsUrl, buildPlaceUrl } from "./maps-links";

interface HyperLocalSearchHUDProps {
  isSearching: boolean;
  data: HyperLocalKbData | null;
  error?: string | null;
  /** Which of `maxAttempts` searches is running. 1 for the only search most sessions need. */
  attempt?: number;
  maxAttempts?: number;
  /** The map origin. Absent address = no map, since there is nothing to centre it on. */
  propertyAddress?: string;
  city?: string;
}

/**
 * The five categories the Maps research prompt in `src/lib/hyper-local/research.ts` actually
 * looks up. The enrichment API is a single opaque await, so in-flight rows are shown as a
 * moving focus only - nothing is marked found or empty until the real result lands.
 */
const RESEARCH_STEPS = [
  { key: "locality", icon: MapPin, label: "Resolving locality & sector" },
  { key: "metro", icon: Train, label: "Nearest metro / rail station" },
  { key: "highways", icon: Navigation, label: "Highways & arterial roads" },
  { key: "schools", icon: School, label: "Schools nearby" },
  { key: "hospitals", icon: Hospital, label: "Hospitals nearby" },
  // Progress only. Once measured, distances render inline on the rows above, so this row is
  // dropped rather than repeating them as a summary.
  { key: "distances", icon: Ruler, label: "Measuring walk & drive distances" },
] as const;

/**
 * Chips shown per place row before the rest are folded behind a toggle.
 *
 * Ten measured hospitals is the research working, but rendered in full it pushes the map -
 * the thing the owner actually reads the panel for - below the fold. Nothing is dropped:
 * the full list is one click away, and the voice agent's knowledge base is untouched either way.
 */
const PREVIEW_CHIP_COUNT = 1;

function formatElapsed(ms: number) {
  return (ms / 1000).toFixed(2);
}

/**
 * The names a finished step resolved to. Rendered as one chip per place so each can carry
 * its own measured distance, rather than a single joined line with the distances orphaned
 * in a row of their own.
 */
function resolveStep(key: string, data: HyperLocalKbData): string[] {
  switch (key) {
    case "locality":
      return data.resolvedLocality ? [data.resolvedLocality] : [];
    case "metro":
      return data.transit?.nearestMetro ? [data.transit.nearestMetro] : [];
    case "highways":
      return data.transit?.majorHighways || [];
    case "schools":
      return data.neighborhood?.topSchools || [];
    case "hospitals":
      return data.neighborhood?.topHospitals || [];
    default:
      return [];
  }
}

export function HyperLocalSearchHUD({
  isSearching,
  data,
  error,
  attempt = 1,
  maxAttempts = 1,
  propertyAddress,
  city,
}: HyperLocalSearchHUDProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [mapTarget, setMapTarget] = useState<{ name: string | null; mode: "walk" | "drive" }>({
    name: null,
    mode: "drive",
  });
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const startRef = useRef<number | null>(null);

  // Timer: restarts on every idle -> searching transition, freezes on the last value when done.
  useEffect(() => {
    if (!isSearching) return;
    startRef.current = performance.now();
    // Elapsed is computed from the start stamp rather than accumulated, so a throttled
    // background tab cannot drift the reported search time. The first tick also clears the
    // previous frozen value, so a re-run does not need a reset write from this effect.
    const tick = setInterval(() => {
      if (startRef.current !== null) setElapsedMs(performance.now() - startRef.current);
    }, 50);
    const cycle = setInterval(() => {
      setActiveStep((i) => (i + 1) % RESEARCH_STEPS.length);
    }, 1100);
    return () => {
      clearInterval(tick);
      clearInterval(cycle);
    };
  }, [isSearching]);

  if (!isSearching && !data && !error) return null;

  const isDone = !isSearching && Boolean(data);
  const isFailed = !isSearching && !data && Boolean(error);
  const grounded = Boolean(data?.grounded);
  const sourceCount = data?.sources?.length || 0;
  // The first search came back with nothing to confirm, so this is the one retry it earns.
  const isRetry = attempt > 1;

  const mapOrigin = propertyAddress ? buildMapOrigin(propertyAddress, city) : "";
  // The embedded map is free and unlimited but needs its own public browser key. Without one
  // the chips still reach Google Maps, just as plain keyless links in a new tab.
  const embedEnabled = Boolean(mapOrigin) && Boolean(getMapEmbedKey());
  const openInGoogleMaps = (name: string, mode: "walk" | "drive") => {
    const place = findDistance(data, name);
    const url = place ? buildDirectionsUrl(mapOrigin, place, mode) : buildPlaceUrl(mapOrigin);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const viewOnMap = !mapOrigin
    ? undefined
    : embedEnabled
      ? (name: string, mode: "walk" | "drive") => setMapTarget({ name, mode })
      : openInGoogleMaps;

  const accent = isFailed
    ? "border-rose-200/80 from-rose-50/70"
    : isDone && !grounded
      ? "border-amber-200/80 from-amber-50/70"
      : isDone
        ? "border-emerald-200/80 from-emerald-50/60"
        : "border-indigo-200/80 from-indigo-50/70";

  return (
    <div className={`rounded-2xl border bg-gradient-to-r via-white to-slate-50 shadow-2xs overflow-hidden ${accent}`}>
      {/* HUD Header: status + live timer */}
      <div className="px-3.5 py-3 flex items-center justify-between gap-3 border-b border-slate-100/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0 text-white ${
              isFailed ? "bg-rose-600" : isDone ? "bg-emerald-600" : "bg-indigo-600"
            }`}
          >
            <Satellite className={`w-4 h-4 ${isSearching ? "animate-pulse" : ""}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                Live Location Research
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[9px] font-bold shrink-0">
                Map Intelligence
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 truncate">
              {isSearching
                ? isRetry
                  ? "First search didn't come back — trying Google Maps once more…"
                  : "Searching Google Maps around your address…"
                : isFailed
                  ? `Location research could not complete after ${attempt} ${attempt === 1 ? "try" : "tries"}`
                  : grounded
                    ? `Searched Google Maps • ${sourceCount} place${sourceCount === 1 ? "" : "s"} verified`
                    : "Completed without Maps grounding — unverified"}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`text-lg font-extrabold tabular-nums leading-none ${
              isSearching ? "text-indigo-700" : isFailed ? "text-rose-700" : "text-slate-800"
            }`}
          >
            {formatElapsed(elapsedMs)}
            <span className="text-xs font-bold text-slate-400 ml-0.5">s</span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
            {isSearching ? (isRetry ? `Retry ${attempt}/${maxAttempts}` : "Searching") : "Search time"}
          </div>
        </div>
      </div>

      {/* Per-category research rows */}
      <div className="px-3.5 py-2.5 space-y-1.5">
        {RESEARCH_STEPS.map((step, idx) => {
          const Icon = step.icon;
          // The measuring step is in-flight progress; its results belong on the rows above.
          if (step.key === "distances" && !isSearching) return null;

          const names = !isSearching && data ? resolveStep(step.key, data) : [];
          const found = names.length > 0;
          const isActive = isSearching && idx === activeStep;
          // Highways are roads, not places, so they never carry a measured distance.
          const measurable = step.key !== "highways" && step.key !== "locality";
          const expanded = expandedRows.includes(step.key);
          const collapsible = names.length > PREVIEW_CHIP_COUNT;
          const shown = expanded ? names : names.slice(0, PREVIEW_CHIP_COUNT);
          // Counted off the cap, not off what is rendered, so the toggle keeps its label
          // once the row is open and the row can be closed again.
          const hidden = names.length - PREVIEW_CHIP_COUNT;

          return (
            <div key={step.key} className="flex items-start gap-2 text-[11px]">
              <Icon
                className={`w-3.5 h-3.5 mt-px shrink-0 ${
                  isActive ? "text-indigo-600" : found ? "text-emerald-600" : "text-slate-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`font-semibold ${
                    isActive ? "text-indigo-800" : found ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {found && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {shown.map((name) =>
                      measurable ? (
                        <PlaceChip
                          key={name}
                          name={name}
                          data={data}
                          onViewOnMap={isDone ? viewOnMap : undefined}
                          isActive={embedEnabled && mapTarget.name === name}
                          compact
                        />
                      ) : (
                        <span
                          key={name}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          {name}
                        </span>
                      )
                    )}

                    {collapsible && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRows((rows) =>
                            expanded ? rows.filter((k) => k !== step.key) : [...rows, step.key]
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-dashed border-slate-300 text-slate-500 text-[11px] font-bold hover:border-blue-300 hover:text-blue-700"
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
                )}
              </div>
              {isSearching ? (
                isActive && (
                  <span className="relative flex h-1.5 w-1.5 mt-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                  </span>
                )
              ) : isDone ? (
                found ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <MinusCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )
              ) : null}
            </div>
          );
        })}
      </div>

      {/* The map itself: property pin by default, a drawn route once a place chip is clicked. */}
      {isDone && embedEnabled && (
        <InlineLocationMap
          data={data}
          origin={mapOrigin}
          city={city}
          selectedName={mapTarget.name}
          mode={mapTarget.mode}
          onChange={(name, mode) => setMapTarget({ name, mode })}
        />
      )}

      {/* Distances were skipped entirely: say so rather than letting the row read as "none found". */}
      {isDone && data?.distancesMeasured === false && (
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-start gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-slate-400 mt-px shrink-0" />
          <p className="text-[10px] font-semibold text-slate-500">
            Distance measurement unavailable — places are listed without distances.
          </p>
        </div>
      )}

      {/* Trust footer: grounding status, or the failure reason */}
      {isFailed ? (
        <div className="px-3.5 py-2 bg-rose-50/70 border-t border-rose-100 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-px shrink-0" />
          <p className="text-[10px] font-semibold text-rose-800">{error}</p>
        </div>
      ) : isDone ? (
        <div
          className={`px-3.5 py-2 border-t flex items-start gap-1.5 ${
            grounded ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/70 border-amber-100"
          }`}
        >
          {grounded ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-px shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-px shrink-0" />
          )}
          <p className={`text-[10px] font-semibold ${grounded ? "text-emerald-800" : "text-amber-800"}`}>
            {grounded
              ? "Grounded in live Google Maps results — confirm the details with Elena."
              : "Google Maps grounding did not fire, so these details are unverified. Please confirm them with Elena."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
