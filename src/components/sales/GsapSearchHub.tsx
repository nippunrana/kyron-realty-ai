"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { BASE_PATH } from "@/lib/base-path";
import {
  Search,
  Sparkles,
  X,
  Building2,
  Bed,
  Bath,
  Square,
  MapPin,
  PawPrint,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export interface SearchHubProperty {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  address: string;
  city?: string | null;
  state?: string | null;
  listingType: string;
  propertyType: string;
  price: string | number;
  bedrooms?: number | null;
  bathrooms?: string | number | null;
  sqft?: number | null;
  coverImageUrl?: string | null;
  images?: string[] | null;
  features?: string[];
  amenities?: string[];
  petPolicyDetail?: string | null;
  isPetFriendly?: boolean;
}

export interface GsapSearchHubProps {
  isOpen: boolean;
  isSearching: boolean;
  activeCity: string | null;
  isPetFriendlyFilter: boolean;
  properties: SearchHubProperty[];
  availableCities: string[];
  onClose: () => void;
  onCitySelect?: (city: string) => void;
  onManualSearch?: (query: string) => void;
  className?: string;
  isMobileTab?: boolean;
}

const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

/** Resolves an image URL safely without double-prefixing BASE_PATH. */
function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return FALLBACK_PROPERTY_IMAGE;
  }
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  if (clean.startsWith(BASE_PATH)) {
    return clean;
  }
  return `${BASE_PATH}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

export function GsapSearchHub({
  isOpen,
  isSearching,
  activeCity,
  properties,
  availableCities,
  onClose,
  onCitySelect,
  onManualSearch,
  className = "",
  isMobileTab = false,
}: GsapSearchHubProps) {
  const cardListRef = useRef<HTMLDivElement>(null);
  const [manualQuery, setManualQuery] = useState("");

  // Stagger animate property cards when results change
  useEffect(() => {
    if (!cardListRef.current || !isOpen) return;

    const cards = cardListRef.current.querySelectorAll(".property-search-card");
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          duration: 0.28,
          ease: "power2.out",
        }
      );
    }
  }, [properties, isOpen]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (manualQuery.trim() && onManualSearch) {
        onManualSearch(manualQuery.trim());
      }
    },
    [manualQuery, onManualSearch]
  );

  return (
    <div
      role="region"
      aria-label="Interactive Property Search Wing"
      className={`h-full w-full bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/20 text-slate-900 overflow-hidden flex flex-col ${className}`}
    >
      {/* ========================================================================= */}
      {/* HEADER: Title, Search Bar & Collapse Button                               */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                <span>Live Property Showcase</span>
                {isSearching && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Searching...</span>
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Close Button (Small Cross) */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200/80 transition-colors cursor-pointer"
              title={isMobileTab ? "Close search tab" : "Close search"}
              aria-label={isMobileTab ? "Close search tab" : "Close search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder={
                activeCity
                  ? `Filter properties in ${activeCity}...`
                  : "Search by city, neighborhood, or keywords..."
              }
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
            {manualQuery && (
              <button
                type="button"
                onClick={() => setManualQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Active Criteria Chips & Count Bar */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeCity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/60 text-[10px]">
                <MapPin className="w-2.5 h-2.5" />
                <span>{activeCity}</span>
              </span>
            )}
            <span className="text-slate-500 font-medium">
              {properties.length} {properties.length === 1 ? "result" : "results"}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Real-time DB Sync
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BODY: Property Grid or Zero Results State                                 */}
      {/* ========================================================================= */}
      <div
        ref={cardListRef}
        className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 min-h-0"
      >
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.map((prop) => {
              const priceFormatted = Number(prop.price).toLocaleString("en-IN");
              const isRent = prop.listingType === "rent";
              const imageUrl = resolveImageUrl(prop.coverImageUrl);

              return (
                <div
                  key={prop.id}
                  className="property-search-card group bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container with Resilient onError Fallback */}
                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={prop.title}
                        loading="lazy"
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_PROPERTY_IMAGE) {
                            e.currentTarget.src = FALLBACK_PROPERTY_IMAGE;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {prop.isPetFriendly && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                            <PawPrint className="w-2.5 h-2.5" />
                            <span>Pet Friendly</span>
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-bold">
                        ₹{priceFormatted}
                        {isRent && <span className="text-[9px] font-normal">/mo</span>}
                      </div>
                    </div>

                    {/* Property Title & Address */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                      {prop.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 line-clamp-1 mb-2">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {[prop.address, prop.city].filter(Boolean).join(", ")}
                      </span>
                    </p>

                    {/* Specs Bar */}
                    <div className="flex items-center gap-2.5 py-1.5 border-t border-slate-100 text-[10.5px] text-slate-600">
                      {prop.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3 h-3 text-slate-400" />
                          <span>{prop.bedrooms} Beds</span>
                        </span>
                      )}
                      {prop.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="w-3 h-3 text-slate-400" />
                          <span>{prop.bathrooms} Baths</span>
                        </span>
                      )}
                      {prop.sqft && (
                        <span className="flex items-center gap-1">
                          <Square className="w-3 h-3 text-slate-400" />
                          <span>{prop.sqft.toLocaleString()} sqft</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 capitalize">
                      {prop.listingType} • {prop.propertyType.replace(/_/g, " ")}
                    </span>
                    <Link
                      href={`/listings/${prop.slug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <span>Explore</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Zero Results State with Clickable City Chips */
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
              No matching listings found
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mb-4">
              {activeCity
                ? `We could not find any active listings in ${activeCity} right now.`
                : "We could not find any active listings matching your search parameters."}
            </p>

            {availableCities.length > 0 && (
              <div className="flex flex-col items-center gap-2 w-full">
                <span className="text-[10.5px] font-semibold text-slate-600">
                  Try one of our active cities:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {availableCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => onCitySelect?.(city)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-[11px] font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      📍 {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FOOTER: Synchronized status                                              */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[10.5px] text-slate-500 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synchronized with Sarah Real-Time Voice</span>
        </span>
        <span className="text-slate-400 font-medium">GSAP Fluid Wing</span>
      </div>
    </div>
  );
}
