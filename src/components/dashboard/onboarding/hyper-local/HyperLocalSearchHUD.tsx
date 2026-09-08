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
} from "lucide-react";
import type { HyperLocalKbData } from "@/db/schema";
import { formatDistance, findDistance } from "./distance-display";

interface HyperLocalSearchHUDProps {
  isSearching: boolean;
  data: HyperLocalKbData | null;
  error?: string | null;
  /** Which of `maxAttempts` searches is running. 1 for the only search most sessions need. */
  attempt?: number;
  maxAttempts?: number;
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
  { key: "distances", icon: Ruler, label: "Measuring walk & drive distances" },
] as const;

function formatElapsed(ms: number) {
  return (ms / 1000).toFixed(2);
}

function resolveStep(key: string, data: HyperLocalKbData): string | null {
  switch (key) {
    case "locality":
      return data.resolvedLocality || null;
    case "metro":
      return data.transit?.nearestMetro || null;
    case "highways": {
      const list = data.transit?.majorHighways || [];
      return list.length ? list.join(" • ") : null;
    }
    case "schools": {
      const list = data.neighborhood?.topSchools || [];
      return list.length ? list.join(" • ") : null;
    }
    case "hospitals": {
      const list = data.neighborhood?.topHospitals || [];
      return list.length ? list.join(" • ") : null;
    }
    case "distances": {
      // Only rows Routes actually routed count; a named place with no route is not a measurement.
      const measured = (data.nearbyDistances || []).filter(
        (d) => d.walkMeters !== undefined || d.driveMeters !== undefined
      );
      if (!measured.length) return null;
      const metro = data.transit?.nearestMetro
        ? formatDistance(findDistance(data, data.transit.nearestMetro))
        : null;
      const lead = metro ? `nearest transit ${metro.label}` : `${measured.length} places measured`;
      return `${measured.length} measured • ${lead}`;
    }
    default:
      return null;
  }
}

export function HyperLocalSearchHUD({
  isSearching,
  data,
  error,
  attempt = 1,
  maxAttempts = 1,
}: HyperLocalSearchHUDProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
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
          const result = !isSearching && data ? resolveStep(step.key, data) : null;
          const isActive = isSearching && idx === activeStep;

          return (
            <div key={step.key} className="flex items-start gap-2 text-[11px]">
              <Icon
                className={`w-3.5 h-3.5 mt-px shrink-0 ${
                  isActive ? "text-indigo-600" : result ? "text-emerald-600" : "text-slate-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <span
                  className={`font-semibold ${
                    isActive ? "text-indigo-800" : result ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {result && <p className="text-slate-500 font-medium truncate">{result}</p>}
              </div>
              {isSearching ? (
                isActive && (
                  <span className="relative flex h-1.5 w-1.5 mt-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                  </span>
                )
              ) : isDone ? (
                result ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <MinusCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )
              ) : null}
            </div>
          );
        })}
      </div>

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
