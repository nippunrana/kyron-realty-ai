"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BASE_PATH } from "@/lib/base-path";
import {
  Search,
  Sparkles,
  X,
  Minimize2,
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
}

/** Resolves an image URL safely without double-prefixing BASE_PATH. */
function resolveImageUrl(url?: string | null): string {
  if (!url) return `${BASE_PATH}/images/hero-luxury-villa.jpg`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith(BASE_PATH)) return url;
  return `${BASE_PATH}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function GsapSearchHub({
  isOpen,
  isSearching,
  activeCity,
  isPetFriendlyFilter,
  properties,
  availableCities,
  onClose,
  onCitySelect,
  onManualSearch,
}: GsapSearchHubProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [manualQuery, setManualQuery] = useState("");

  // Animate open / close / minimize transitions with GSAP
  useGSAP(
    () => {
      if (!containerRef.current) return;

      if (!isOpen) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.9,
          y: -20,
          duration: 0.25,
          ease: "power2.in",
          pointerEvents: "none",
        });
        return;
      }

      if (isMinimized) {
        gsap.to(containerRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          width: 360,
          height: 52,
          borderRadius: 9999,
          duration: 0.35,
          ease: "power3.inOut",
          pointerEvents: "auto",
        });
      } else {
        gsap.to(containerRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
          width: "min(92vw, 760px)",
          height: "min(85vh, 560px)",
          borderRadius: 28,
          duration: 0.45,
          ease: "power3.out",
          pointerEvents: "auto",
        });
      }
    },
    { dependencies: [isOpen, isMinimized], scope: containerRef }
  );

  // Stagger animate property cards when results change
  useEffect(() => {
    if (!cardListRef.current || isMinimized || !isOpen) return;

    const cards = cardListRef.current.querySelectorAll(".property-search-card");
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.07,
          duration: 0.3,
          ease: "power2.out",
        }
      );
    }
  }, [properties, isMinimized, isOpen]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (manualQuery.trim() && onManualSearch) {
        onManualSearch(manualQuery.trim());
      }
    },
    [manualQuery, onManualSearch]
  );

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Interactive Property Search Hub"
      className="fixed top-5 inset-x-0 z-40 flex justify-center px-4 select-none pointer-events-none"
    >
      <div
        ref={containerRef}
        className="pointer-events-auto bg-white/95 border border-slate-200/90 shadow-2xl shadow-slate-900/15 backdrop-blur-xl text-slate-900 overflow-hidden flex flex-col transition-shadow"
      >
        {/* ========================================================================= */}
        {/* MINIMIZED STATE PILL                                                     */}
        {/* ========================================================================= */}
        {isMinimized ? (
          <div className="w-full h-full px-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-xs font-bold text-slate-800 truncate">
                {isSearching
                  ? "Sarah is searching properties..."
                  : `${properties.length} ${properties.length === 1 ? "Listing" : "Listings"} Found in ${activeCity || "Search"}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close search hub"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* EXPANDED SHOWCASE CONSOLE                                                */
          /* ========================================================================= */
          <>
            {/* Header: Title, Search Bar & Controls */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Live Property Showcase</span>
                      {isSearching && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Searching...</span>
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Minimize to top bar"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close search hub"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Interactive Search Bar Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder={
                      activeCity
                        ? `Filter properties in ${activeCity}...`
                        : "Search by city, neighborhood, or keywords..."
                    }
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                  />
                  {manualQuery && (
                    <button
                      type="button"
                      onClick={() => setManualQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  Search
                </button>
              </form>

              {/* Active Filter Chips */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                {activeCity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                    <MapPin className="w-3 h-3" />
                    <span>{activeCity}</span>
                  </span>
                )}
                {isPetFriendlyFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <PawPrint className="w-3 h-3 text-emerald-600" />
                    <span>Pet Friendly</span>
                  </span>
                )}
                <span className="text-[11px] text-slate-500 font-medium ml-1">
                  {properties.length} {properties.length === 1 ? "result" : "results"}
                </span>
              </div>
            </div>

            {/* Body: Property Grid or Zero Results State */}
            <div
              ref={cardListRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-0"
            >
              {properties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {properties.map((prop) => {
                    const priceFormatted = Number(prop.price).toLocaleString("en-IN");
                    const isRent = prop.listingType === "rent";
                    const imageUrl = resolveImageUrl(prop.coverImageUrl);

                    return (
                      <div
                        key={prop.id}
                        className="property-search-card group bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Image & Badges */}
                          <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <Image
                              src={imageUrl}
                              alt={prop.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 360px"
                              unoptimized={true}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              {prop.isPetFriendly && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                                  <PawPrint className="w-2.5 h-2.5" />
                                  <span>Pet Friendly</span>
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-white text-[11px] font-bold">
                              ₹{priceFormatted}
                              {isRent && <span className="text-[9px] font-normal">/mo</span>}
                            </div>
                          </div>

                          {/* Property Details */}
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
                          <div className="flex items-center gap-3 py-1.5 border-t border-slate-100 text-[11px] text-slate-600">
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
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
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
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    No matching listings found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    {activeCity
                      ? `We could not find any active listings matching your search in ${activeCity}.`
                      : "We could not find any active listings matching your current search parameters."}
                  </p>

                  {availableCities.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Explore available cities with active listings:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        {availableCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => onCitySelect?.(city)}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
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

            {/* Footer Status Bar */}
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synchronized with Sarah Real-Time Voice</span>
              </span>
              <span className="text-slate-400">GSAP Animated Console</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
