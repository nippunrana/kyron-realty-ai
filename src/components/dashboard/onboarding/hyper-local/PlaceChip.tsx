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
  /** The place the map is currently routing to, so the list reads as the map's selector. */
  isActive?: boolean;
}

/**
 * One nearby place: its name, then a pill per travel mode that is actually worth offering.
 *
 * Names come from the `HyperLocalKbData` string lists, which stay authoritative; a place
 * with no measurement simply renders as a plain name.
 */
export function PlaceChip({
  name,
  data,
  onViewOnMap,
  compact = false,
  isActive = false,
}: PlaceChipProps) {
  const pills = distancePills(findDistance(data, name));
  // An unmeasured place has no route to draw, so its name stays plain text rather than a
  // button that would only ever re-centre the map on the property.
  const nameOpensMap = Boolean(onViewOnMap) && pills.length > 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium border ${
        isActive
          ? "bg-blue-50 border-blue-300 text-blue-900"
          : "bg-white border-slate-200 text-slate-800"
      } ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
    >
      {nameOpensMap ? (
        <button
          type="button"
          onClick={() => onViewOnMap!(name, pills[0].mode)}
          className="text-left hover:underline cursor-pointer"
          title={`Show ${name} on the map`}
        >
          {name}
        </button>
      ) : (
        <span>{name}</span>
      )}

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
