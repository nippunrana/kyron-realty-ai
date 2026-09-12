"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, PawPrint, ArrowRight, Sparkles } from "lucide-react";

const POPULAR_CITIES = [
  "All Cities",
  "Gurugram",
  "New Delhi",
  "Bengaluru",
  "Mumbai",
  "Dubai",
];

export function QuickListingSearchBar() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [listingType, setListingType] = useState<"all" | "rent" | "sale">("all");
  const [petFriendly, setPetFriendly] = useState<boolean>(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity && selectedCity !== "All Cities") {
      params.set("city", selectedCity);
    }
    if (listingType !== "all") {
      params.set("listingType", listingType);
    }
    if (petFriendly) {
      params.set("petFriendly", "true");
    }

    const query = params.toString();
    router.push(`/listings${query ? `?${query}` : ""}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-6">
      <form
        onSubmit={handleSearch}
        className="luxury-card rounded-2xl p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 transition-all"
      >
        {/* City Selector */}
        <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <label htmlFor="quick-city-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">
              Location
            </label>
            <select
              id="quick-city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer truncate"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listing Type Toggle (Rent / Sale / All) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 shrink-0">
          {(["all", "rent", "sale"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setListingType(type)}
              className={`px-3 py-2 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                listingType === type
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {type === "all" ? "All Types" : type === "rent" ? "For Rent" : "For Sale"}
            </button>
          ))}
        </div>

        {/* 1-Click Pet-Friendly Toggle */}
        <button
          type="button"
          onClick={() => setPetFriendly((prev) => !prev)}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
            petFriendly
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20"
              : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Filter for pet-friendly properties"
        >
          <PawPrint className={`w-3.5 h-3.5 ${petFriendly ? "text-emerald-600 fill-emerald-600" : "text-slate-400"}`} />
          <span>Pet-Friendly</span>
        </button>

        {/* Search / Explore CTA Button */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/25 transition-all hover:scale-101 cursor-pointer shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Explore Listings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Micro-hint */}
      <div className="flex items-center justify-center gap-2 mt-2.5 text-[11px] text-slate-500">
        <Sparkles className="w-3 h-3 text-indigo-500" />
        <span>Every listing shows real travel times — and answers its own calls, at any hour</span>
      </div>
    </div>
  );
}
