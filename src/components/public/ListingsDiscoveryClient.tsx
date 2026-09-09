"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  PhoneCall,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Radio,
  ArrowRight,
  Search,
  X,
  Sparkles,
  Train,
  ShieldCheck,
} from "lucide-react";
import { VoiceSalesAgentModal } from "@/components/voice/VoiceSalesAgentModal";
import { BASE_PATH } from "@/lib/base-path";
import { formatPropertyTypeLabel } from "@/lib/property-types";

export interface DiscoveryPropertyItem {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  listingType: string;
  propertyType: string;
  price: string | number;
  bedrooms: number | null;
  bathrooms: string | number | null;
  sqft: number | null;
  coverImageUrl: string | null;
  images: unknown;
  status: string;
  searchTags?: string[];
  transit?: {
    nearestMetro?: string;
    majorHighways?: string[];
    commuteConnectivity?: string;
  } | null;
  neighborhood?: {
    landmarks?: string[];
    topSchools?: string[];
    topHospitals?: string[];
    vibeAndLivability?: string;
  } | null;
}

interface ListingsDiscoveryClientProps {
  initialProperties: DiscoveryPropertyItem[];
  availableCities: string[];
}

export function ListingsDiscoveryClient({
  initialProperties,
  availableCities,
}: ListingsDiscoveryClientProps) {
  const [propertiesList, setPropertiesList] = useState<DiscoveryPropertyItem[]>(initialProperties);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "rent" | "sale">("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("all");
  const [voiceModalProperty, setVoiceModalProperty] = useState<DiscoveryPropertyItem | null>(null);
  const [, startTransition] = useTransition();

  // Dynamic search fetch when query/city/type changes
  useEffect(() => {
    const controller = new AbortController();

    const fetchFiltered = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("query", searchQuery.trim());
        if (selectedCity !== "all") params.set("city", selectedCity);
        if (selectedType !== "all") params.set("listingType", selectedType);

        const res = await fetch(`${BASE_PATH}/api/properties/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.properties)) {
            startTransition(() => {
              setPropertiesList(data.properties);
            });
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Search fetch failed:", err);
      }
    };

    const timer = setTimeout(fetchFiltered, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCity, selectedType]);

  // Client-side bedroom filter
  const displayedProperties = useMemo(() => {
    return propertiesList.filter((prop) => {
      if (selectedBedrooms !== "all") {
        const minBeds = parseInt(selectedBedrooms, 10);
        if ((prop.bedrooms ?? 0) < minBeds) return false;
      }
      return true;
    });
  }, [propertiesList, selectedBedrooms]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedType("all");
    setSelectedBedrooms("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-slate-900 group">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm sm:text-base leading-none">
                Kyron Realty
              </span>
              <span className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
                Property Discovery
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>List a Property</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>24/7 AI Voice Concierge • Powered by Agora SD-RTN</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Find Your Next Home with Voice Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Every property is backed by a dedicated real-time AI estate agent. Ask questions about
            metro transit, schools, parking, and arrange instant property tours.
          </p>
        </section>

        {/* Filter & Search Bar */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city, neighborhood, metro, or keywords..."
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Listing Type Toggle */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedType === "all"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Listings
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("rent")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedType === "rent"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                For Rent
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("sale")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedType === "sale"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                For Sale
              </button>
            </div>

            {/* Bedrooms Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedBedrooms}
                onChange={(e) => setSelectedBedrooms(e.target.value)}
                className="py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Any Bedrooms</option>
                <option value="1">1+ Bedrooms</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>
          </div>

          {/* City Filter Pills */}
          {availableCities.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>Popular Cities:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCity("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCity === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                All Cities
              </button>
              {availableCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCity.toLowerCase() === c.toLowerCase()
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-slate-700">
            {displayedProperties.length} {displayedProperties.length === 1 ? "Property" : "Properties"} Available
            {selectedCity !== "all" && ` in ${selectedCity}`}
          </h2>
          {(searchQuery || selectedCity !== "all" || selectedType !== "all" || selectedBedrooms !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Property Grid or Zero State */}
        {displayedProperties.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              No matching properties found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
              We couldn&apos;t find any properties matching your current search criteria. Try clearing
              your filters or exploring other cities.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProperties.map((prop) => {
              const coverImage =
                prop.coverImageUrl ||
                (Array.isArray(prop.images) && prop.images[0]) ||
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

              const numericPrice = Number(prop.price);
              const hasValidPrice = !isNaN(numericPrice) && numericPrice > 0;
              const metroSnippet = prop.transit?.nearestMetro;

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Thumbnail */}
                    <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                          {prop.listingType === "rent" ? "For Rent" : "For Sale"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold uppercase">
                          {formatPropertyTypeLabel(prop.propertyType)}
                        </span>
                      </div>

                      {/* Live Voice Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                          <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
                          <span>Voice AI Ready</span>
                        </span>
                      </div>

                      {/* Price Overlay */}
                      <div className="absolute bottom-3 left-3 text-white">
                        <div className="text-lg font-extrabold tracking-tight">
                          {hasValidPrice ? (
                            <>
                              ₹{numericPrice.toLocaleString("en-IN")}
                              {prop.listingType === "rent" && (
                                <span className="text-xs font-normal text-slate-200">/mo</span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-slate-300 italic">
                              Price on Request
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5">
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">
                          {prop.address ? `${prop.address}${prop.city ? `, ${prop.city}` : ""}` : "Address verified"}
                        </span>
                      </div>

                      <Link href={`/listings/${prop.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 hover:text-blue-600 transition-colors mb-2.5">
                          {prop.title}
                        </h3>
                      </Link>

                      {/* Specs Row */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 pb-3 border-b border-slate-100 font-medium">
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.bedrooms ?? "—"} Beds</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.bathrooms ?? "—"} Baths</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Maximize className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.sqft ?? "—"} sf</span>
                        </span>
                      </div>

                      {/* Hyper-Local Tag Snippets */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {metroSnippet && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                            <Train className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{metroSnippet}</span>
                          </span>
                        )}
                        {Array.isArray(prop.searchTags) &&
                          prop.searchTags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setVoiceModalProperty(prop)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Talk with AI</span>
                    </button>

                    <Link
                      href={`/listings/${prop.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Voice Sales Agent Modal (Live WebRTC Agora) */}
      {voiceModalProperty && (
        <VoiceSalesAgentModal
          property={{
            id: voiceModalProperty.id,
            title: voiceModalProperty.title,
            slug: voiceModalProperty.slug,
            price: voiceModalProperty.price,
            listingType: voiceModalProperty.listingType,
            address: voiceModalProperty.address,
            city: voiceModalProperty.city || undefined,
            coverImageUrl: voiceModalProperty.coverImageUrl || undefined,
          }}
          onClose={() => setVoiceModalProperty(null)}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Kyron Realty AI</span>
            <span>— Voice-First Real Estate Discovery</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Agora Conversational Gateway</span>
            </div>
            <span>•</span>
            <span>&copy; {new Date().getFullYear()} Kyron Realty AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
