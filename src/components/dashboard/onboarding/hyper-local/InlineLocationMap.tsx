"use client";

import { useState } from "react";
import { Building2, Footprints, Car, ExternalLink, MousePointerClick } from "lucide-react";
import type { HyperLocalKbData } from "@/db/schema";
import { findDistance } from "./distance-display";
import { buildEmbedSrc, getMapEmbedKey } from "./map-embed";
import { buildDirectionsUrl, buildPlaceUrl } from "./maps-links";

interface InlineLocationMapProps {
  data: HyperLocalKbData | null;
  /** Full origin string from `buildMapOrigin`, already carrying the city. */
  origin: string;
  city?: string;
  /** Place the map is routing to, or null for a pin on the property. */
  selectedName: string | null;
  mode: "walk" | "drive";
  onChange: (name: string | null, mode: "walk" | "drive") => void;
}

/**
 * The map living inside the Live Location Research HUD, as opposed to `LocationMapModal`
 * which is the same map opened full-size from the review card.
 *
 * Deliberately a controlled component: the place chips that drive it sit above it in the
 * HUD, so the selection cannot live down here.
 */
export function InlineLocationMap({
  data,
  origin,
  city,
  selectedName,
  mode,
  onChange,
}: InlineLocationMapProps) {
  // The HUD scrolls inside the inspector, and a live Google map swallows the wheel to zoom.
  // The map therefore stays inert until it is clicked, so scrolling past it never traps the page.
  const [interactive, setInteractive] = useState(false);

  const place = selectedName ? findDistance(data, selectedName) : undefined;
  const src = buildEmbedSrc({ key: getMapEmbedKey(), origin, place, mode, city });

  return (
    <div className="border-t border-slate-100">
      {/* Control strip: what the map is showing, and the way out to real Google Maps. */}
      <div className="px-3.5 py-2 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onChange(null, mode)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
            place
              ? "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              : "bg-blue-600 text-white border-blue-600"
          }`}
        >
          <Building2 className="w-3 h-3" />
          The Property
        </button>

        {place && (
          <>
            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[40%]">
              Route to {place.name}
            </span>
            {(["walk", "drive"] as const).map((m) => {
              const Icon = m === "walk" ? Footprints : Car;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChange(place.name, m)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    mode === m
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {m === "walk" ? "Walk" : "Drive"}
                </button>
              );
            })}
          </>
        )}

        {/* Keyless handoff to the real Google Maps, where the owner can actually navigate. */}
        <a
          href={place ? buildDirectionsUrl(origin, place, mode) : buildPlaceUrl(origin)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold hover:border-blue-300 hover:text-blue-700"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Google Maps
        </a>
      </div>

      <div className="relative bg-slate-100">
        <iframe
          key={src}
          title={place ? `Route from the property to ${place.name}` : "Property location map"}
          src={src}
          className="w-full h-56 border-0 block"
          loading="lazy"
          // A referrer-restricted key needs the Referer header to reach Google.
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!interactive && (
          <button
            type="button"
            onClick={() => setInteractive(true)}
            className="absolute inset-0 flex items-end justify-center pb-3 bg-transparent group cursor-pointer"
            aria-label="Activate the map"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 text-slate-700 text-[10px] font-bold shadow-sm group-hover:border-blue-300 group-hover:text-blue-700">
              <MousePointerClick className="w-3 h-3" />
              Click to interact
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
