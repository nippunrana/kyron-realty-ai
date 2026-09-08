"use client";

import { Footprints, Car, Map as MapIcon } from "lucide-react";
import type { HyperLocalKbData } from "@/db/schema";
import { distancePills, findDistance } from "./distance-display";

interface PlaceChipProps {
  name: string;
  data: HyperLocalKbData | null | undefined;
  /** Absent when no map key is configured, which hides the map affordance entirely. */
  onViewOnMap?: (name: string, mode: "walk" | "drive") => void;
  /** Compact drops the standalone map button and tightens padding, for the inspector HUD. */
  compact?: boolean;
}

/**
 * One nearby place: its name, then a pill per travel mode that is actually worth offering.
 *
 * Names come from the `HyperLocalKbData` string lists, which stay authoritative; a place
 * with no measurement simply renders as a plain name.
 */
export function PlaceChip({ name, data, onViewOnMap, compact = false }: PlaceChipProps) {
  const pills = distancePills(findDistance(data, name));

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span>{name}</span>

      {pills.map((pill) => {
        const Icon = pill.mode === "walk" ? Footprints : Car;
        const content = (
          <>
            <Icon className="w-3 h-3 shrink-0" />
            {pill.label}
          </>
        );
        const classes = `inline-flex items-center gap-1 pl-1.5 border-l border-slate-200 text-[11px] font-semibold ${
          pill.mode === "walk" ? "text-emerald-700" : "text-blue-700"
        }`;

        return onViewOnMap ? (
          <button
            key={pill.mode}
            type="button"
            onClick={() => onViewOnMap(name, pill.mode)}
            className={`${classes} hover:underline cursor-pointer`}
            title={`View the ${pill.mode === "walk" ? "walking" : "driving"} route on the map`}
          >
            {content}
          </button>
        ) : (
          <span key={pill.mode} className={classes}>
            {content}
          </span>
        );
      })}

      {onViewOnMap && !compact && (
        <button
          type="button"
          onClick={() => onViewOnMap(name, pills[0]?.mode || "drive")}
          className="text-slate-400 hover:text-blue-600 shrink-0"
          aria-label={`View ${name} on the map`}
        >
          <MapIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
