"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { BASE_PATH } from "@/lib/base-path";
import {
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
  Mic,
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
  isPetFriendlyFilter?: boolean;
  activeBedrooms?: number | null;
  activeListingType?: "rent" | "sale" | null;
  activeMaxPrice?: number | null;
  properties: SearchHubProperty[];
  availableCities?: string[];
  onClose: () => void;
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
  isPetFriendlyFilter = false,
  activeBedrooms = null,
  activeListingType = null,
  activeMaxPrice = null,
  properties,
  onClose,
  className = "",
  isMobileTab = false,
}: GsapSearchHubProps) {
  const cardListRef = useRef<HTMLDivElement>(null);

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

  const activeFiltersCount =
    (activeCity ? 1 : 0) +
    (isPetFriendlyFilter ? 1 : 0) +
    (activeBedrooms ? 1 : 0) +
    (activeListingType ? 1 : 0) +
    (activeMaxPrice ? 1 : 0);

  return (
    <div
      role="region"
      aria-label="Interactive Property Search Wing"
      className={`h-full w-full bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/20 text-slate-900 overflow-hidden flex flex-col ${className}`}
    >
      {/* ========================================================================= */}
      {/* HEADER: Voice Status, Active Filters & Close Button                       */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2">
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Pure Voice Mode Pill */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80">
              <Mic className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
              <span>Voice Controlled</span>
            </span>

            {/* Close Button */}
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

        {/* Active Voice Filter Chips */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeCity && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/60 text-[10px]">
                <MapPin className="w-2.5 h-2.5" />
                <span>{activeCity}</span>
              </span>
            )}
            {activeBedrooms && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200/60 text-[10px]">
                <Bed className="w-2.5 h-2.5" />
                <span>{activeBedrooms} BHK</span>
              </span>
            )}
            {isPetFriendlyFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60 text-[10px]">
                <PawPrint className="w-2.5 h-2.5" />
                <span>Pet Friendly</span>
              </span>
            )}
            {activeListingType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200/60 text-[10px] capitalize">
                <span>For {activeListingType}</span>
              </span>
            )}
            {activeMaxPrice && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px]">
                <span>≤ ₹{activeMaxPrice.toLocaleString()}</span>
              </span>
            )}
            {activeFiltersCount === 0 && (
              <span className="text-[10.5px] text-slate-400 italic">
                Speak any criteria to Sarah...
              </span>
            )}
          </div>

          <span className="text-slate-500 font-semibold text-[10.5px] shrink-0">
            {properties.length} {properties.length === 1 ? "home" : "homes"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BODY: Property Grid or Voice-Guided Zero Results State                    */}
      {/* ========================================================================= */}
      <div
        ref={cardListRef}
        className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 min-h-0"
      >
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.map((prop) => {
              const priceNum = typeof prop.price === "string" ? parseFloat(prop.price) : prop.price;
              const priceFormatted = !isNaN(priceNum) && priceNum > 0 ? priceNum.toLocaleString("en-IN") : "Price on Request";
              const isRent = prop.listingType === "rent";
              const coverImg = resolveImageUrl(prop.coverImageUrl || prop.images?.[0]);

              return (
                <div
                  key={prop.id}
                  className="property-search-card group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 p-3 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Container with Badges */}
                    <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                      <img
                        src={coverImg}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
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
          /* Zero Results State with Voice AI Guidance */
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
              No matching listings found
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mb-3">
              {activeCity
                ? `No properties match this combination of filters in ${activeCity}:`
                : "No properties match your current search criteria:"}
            </p>

            {/* Active filters causing 0 results */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-xs mb-5">
              {activeCity && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-semibold border border-slate-200">
                  📍 {activeCity}
                </span>
              )}
              {activeBedrooms && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10.5px] font-semibold border border-purple-200">
                  🛏️ {activeBedrooms} BHK
                </span>
              )}
              {isPetFriendlyFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold border border-emerald-200">
                  🐾 Pet Friendly
                </span>
              )}
              {activeListingType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-semibold border border-amber-200 capitalize">
                  For {activeListingType}
                </span>
              )}
            </div>

            {/* Pure Voice Guidance Card */}
            <div className="w-full max-w-sm p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-left">
              <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold mb-1">
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span>Just speak to Sarah to adjust:</span>
              </div>
              <ul className="text-[10.5px] text-slate-600 space-y-1 pl-5 list-disc">
                <li>&ldquo;Show me other bedroom options&rdquo;</li>
                <li>&ldquo;Clear filters to show all homes in {activeCity || "this city"}&rdquo;</li>
                <li>&ldquo;Check properties in another city&rdquo;</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FOOTER: Synchronized voice status                                        */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[10.5px] text-slate-500 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synchronized with Sarah Real-Time Voice</span>
        </span>
        <span className="text-slate-400 font-medium">100% Voice Controlled</span>
      </div>
    </div>
  );
}
