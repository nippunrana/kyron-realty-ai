"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  PhoneCall,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Radio,
  ExternalLink,
  Trash2,
  ArrowRight,
  FileEdit,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { DeletePropertyModal } from "./DeletePropertyModal";
import { BASE_PATH } from "@/lib/base-path";
import { formatPropertyTypeLabel } from "@/lib/property-types";

export interface ListingCardItem {
  id: number;
  slug: string;
  title: string;
  address: string;
  city: string | null;
  listingType: string;
  propertyType: string;
  price: string | number;
  bedrooms: number | null;
  bathrooms: string | number | null;
  sqft: number | null;
  coverImageUrl: string | null;
  images: unknown;
  status: string;
}

interface PropertyListingsSectionProps {
  initialProperties: ListingCardItem[];
}

export function PropertyListingsSection({ initialProperties }: PropertyListingsSectionProps) {
  const [items, setItems] = useState<ListingCardItem[]>(initialProperties);
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [propertyToDelete, setPropertyToDelete] = useState<ListingCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const publishedItems = items.filter((item) => item.status !== "draft");
  const draftItems = items.filter((item) => item.status === "draft");

  const tabItems = activeTab === "published" ? publishedItems : draftItems;

  // Extract unique cities from current tab's items
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    tabItems.forEach((item) => {
      if (item.city && item.city.trim()) {
        citiesSet.add(item.city.trim());
      }
    });
    return Array.from(citiesSet).sort();
  }, [tabItems]);

  // Filter items by city and search query
  const displayedItems = useMemo(() => {
    return tabItems.filter((item) => {
      if (selectedCity !== "all") {
        const itemCity = item.city?.toLowerCase() || "";
        if (itemCity !== selectedCity.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchAddress = item.address?.toLowerCase().includes(q);
        const matchCity = item.city?.toLowerCase().includes(q);
        if (!matchTitle && !matchAddress && !matchCity) return false;
      }
      return true;
    });
  }, [tabItems, selectedCity, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`${BASE_PATH}/api/properties/${propertyToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete property listing.");
      }

      // Optimistically remove from state
      setItems((prev) => prev.filter((item) => item.id !== propertyToDelete.id));
      setPropertyToDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setDeleteError(message);
      console.error("Delete property error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mb-10">
      {deleteError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section Header & Segmented Pill Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Property Inventory
            </h2>

            {/* Segmented Pill Tabs */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("published")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "published"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Published</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "published"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-300/60 text-slate-700"
                  }`}
                >
                  {publishedItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("drafts")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "drafts"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Drafts</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === "drafts"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-300/60 text-slate-700"
                  }`}
                >
                  {draftItems.length}
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "published"
              ? "Every listing is deployed with real-time Agora speech intelligence and dynamic price guardrails."
              : "Incomplete listings awaiting photo uploads, speech guardrail tuning, or final review."}
          </p>
        </div>

        {items.length > 0 && (
          <Link
            href="/dashboard/properties/new"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>+ Add another listing</span>
          </Link>
        )}
      </div>

      {/* Search & City Filter Bar */}
      {tabItems.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, address, or city..."
              className="w-full pl-9 pr-9 py-2 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
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

          {/* City Filter Pills */}
          {availableCities.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>City:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCity("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCity === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                All Cities ({tabItems.length})
              </button>
              {availableCities.map((c) => {
                const count = tabItems.filter((i) => i.city?.toLowerCase() === c.toLowerCase()).length;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCity(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCity.toLowerCase() === c.toLowerCase()
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                    }`}
                  >
                    {c} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid or Zero State */}
      {tabItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
            {activeTab === "published" ? (
              <Building2 className="w-8 h-8" />
            ) : (
              <FileEdit className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
            {activeTab === "published"
              ? "No Published Properties Yet"
              : "No Draft Listings Found"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
            {activeTab === "published"
              ? "Launch your first property in under 60 seconds. Talk with our voice wizard to synthesize a verified knowledge base."
              : "You do not have any pending drafts. Start a new property onboarding session anytime to automatically save progress."}
          </p>
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Onboarding Studio</span>
          </Link>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No matching properties found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            We couldn&apos;t find any {activeTab} properties matching your current search or city filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCity("all");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedItems.map((prop) => {
            const isDraft = prop.status === "draft";
            const coverImage =
              prop.coverImageUrl ||
              (Array.isArray(prop.images) && prop.images[0]) ||
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

            const numericPrice = Number(prop.price);
            const hasValidPrice = !isNaN(numericPrice) && numericPrice > 0;

            return (
              <div
                key={prop.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                        {prop.listingType === "rent" ? "For Rent" : "For Sale"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold uppercase">
                        {formatPropertyTypeLabel(prop.propertyType)}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="absolute top-3 right-3">
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                          <Radio className="w-3 h-3 animate-pulse text-emerald-300" />
                          <span>Voice AI Live</span>
                        </span>
                      )}
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
                            Price Pending
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
                        {prop.address ? `${prop.address}${prop.city ? `, ${prop.city}` : ""}` : "Address pending"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 mb-3">
                      {prop.title || "Untitled Property"}
                    </h3>

                    {/* Specs Pill Row */}
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
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <Link
                        href={`/dashboard/properties/new?draftId=${prop.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm shadow-blue-600/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Resume Setup</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/listings/${prop.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Test Voice Agent</span>
                        </Link>

                        <Link
                          href={`/listings/${prop.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                          title="Open Public Listing in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setPropertyToDelete(prop)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title={isDraft ? "Delete draft listing" : "Delete property listing"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <DeletePropertyModal
        isOpen={Boolean(propertyToDelete)}
        onClose={() => {
          if (!isDeleting) setPropertyToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        property={propertyToDelete}
        isDeleting={isDeleting}
      />
    </section>
  );
}
