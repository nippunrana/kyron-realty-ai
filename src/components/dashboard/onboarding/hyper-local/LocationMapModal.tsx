"use client";

import { useState } from "react";
import { X, MapPin, Footprints, Car, Building2, ExternalLink } from "lucide-react";
import { buildDirectionsUrl, buildPlaceUrl } from "./maps-links";
import { buildEmbedSrc, buildMapOrigin, getMapEmbedKey } from "./map-embed";
import type { HyperLocalKbData, NearbyPlaceDistance } from "@/db/schema";

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HyperLocalKbData | null;
  propertyAddress: string;
  city?: string;
  /** Place name to open on, or null for the property itself. */
  initialPlaceName?: string | null;
  initialMode?: "walk" | "drive";
}

export function LocationMapModal({
  isOpen,
  onClose,
  data,
  propertyAddress,
  city,
  initialPlaceName = null,
  initialMode = "drive",
}: LocationMapModalProps) {
  const [selected, setSelected] = useState<string | null>(initialPlaceName);
  const [mode, setMode] = useState<"walk" | "drive">(initialMode);

  if (!isOpen) return null;

  const key = getMapEmbedKey();
  const origin = buildMapOrigin(propertyAddress, city);
  const places = (data?.nearbyDistances || []).filter(
    (p) => p.walkMeters !== undefined || p.driveMeters !== undefined
  );

  const current = selected ? places.find((p) => p.name === selected) : null;

  const src = buildEmbedSrc({ key, origin, place: current, mode, city });

  const grouped: Array<[string, NearbyPlaceDistance[]]> = [
    ["Transit", places.filter((p) => p.category === "transit")],
    ["Schools", places.filter((p) => p.category === "school")],
    ["Hospitals", places.filter((p) => p.category === "hospital")],
  ];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      // The review card sits underneath at z-50; without this its backdrop handler would
      // close both at once.
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-map-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 id="location-map-title" className="text-sm font-extrabold text-slate-900 truncate">
                {current ? `Route to ${current.name}` : "Property Location"}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">{origin}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Keyless handoff to the real Google Maps, where the owner can navigate. */}
            <a
              href={current ? buildDirectionsUrl(origin, current, mode) : buildPlaceUrl(origin)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold hover:border-blue-300 hover:text-blue-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Google Maps</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close map"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Place selector */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center gap-1.5 shrink-0 max-h-28 overflow-y-auto">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              !current
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            <Building2 className="w-3 h-3" />
            The Property
          </button>

          {grouped.map(([label, list]) =>
            list.length ? (
              <span key={label} className="inline-flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                  {label}
                </span>
                {list.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => setSelected(p.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                      current?.placeId === p.placeId
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </span>
            ) : null
          )}
        </div>

        {/* Travel mode toggle, only meaningful on a route */}
        {current && (
          <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-1.5 shrink-0">
            {(["walk", "drive"] as const).map((m) => {
              const Icon = m === "walk" ? Footprints : Car;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border ${
                    mode === m
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m === "walk" ? "Walking" : "Driving"}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 min-h-0 bg-slate-100">
          <iframe
            key={src}
            title={current ? `Route from the property to ${current.name}` : "Property location map"}
            src={src}
            className="w-full h-full min-h-[320px] border-0"
            loading="lazy"
            allowFullScreen
            // A referrer-restricted key needs the Referer header to reach Google.
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
