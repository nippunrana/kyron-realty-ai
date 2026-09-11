"use client";

import { useState, useMemo } from "react";
import {
  Train,
  GraduationCap,
  HeartPulse,
  Footprints,
  Car,
  Building2,
  ExternalLink,
  Maximize2,
  Compass,
  MousePointerClick,
  Route,
} from "lucide-react";
import type { HyperLocalKbData, NearbyPlaceDistance } from "@/db/schema";
import { distancePills, findDistance } from "@/components/dashboard/onboarding/hyper-local/distance-display";
import { buildEmbedSrc, buildMapOrigin, getMapEmbedKey } from "@/components/dashboard/onboarding/hyper-local/map-embed";
import { buildDirectionsUrl, buildPlaceUrl } from "@/components/dashboard/onboarding/hyper-local/maps-links";
import { LocationMapModal } from "@/components/dashboard/onboarding/hyper-local/LocationMapModal";

interface PropertyCommuteExplorerProps {
  hyperLocal: HyperLocalKbData | null | undefined;
  propertyAddress: string;
  city?: string;
}

type FilterCategory = "all" | "transit" | "school" | "hospital";

interface UnifiedPlace {
  name: string;
  category: "transit" | "school" | "hospital";
  placeId?: string;
  distanceData?: NearbyPlaceDistance;
}

export function PropertyCommuteExplorer({
  hyperLocal,
  propertyAddress,
  city,
}: PropertyCommuteExplorerProps) {
  const [activeTab, setActiveTab] = useState<FilterCategory>("all");
  const [selectedPlace, setSelectedPlace] = useState<UnifiedPlace | null>(null);
  const [travelMode, setTravelMode] = useState<"walk" | "drive">("walk");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapInteractive, setMapInteractive] = useState(false);

  const origin = useMemo(() => buildMapOrigin(propertyAddress, city), [propertyAddress, city]);
  const embedKey = getMapEmbedKey();

  // Consolidate destinations from measured distances and named lists without duplicates
  const unifiedPlaces: UnifiedPlace[] = useMemo(() => {
    const list: UnifiedPlace[] = [];
    const seen = new Set<string>();

    // 1. Measured places from Routes API (most accurate, with placeId & meters)
    (hyperLocal?.nearbyDistances || []).forEach((d) => {
      const key = d.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          name: d.name,
          category: d.category,
          placeId: d.placeId,
          distanceData: d,
        });
      }
    });

    // 2. Named Metro
    if (hyperLocal?.transit?.nearestMetro) {
      const name = hyperLocal.transit.nearestMetro.trim();
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          name,
          category: "transit",
          distanceData: findDistance(hyperLocal, name),
        });
      }
    }

    // 3. Named Schools
    (hyperLocal?.neighborhood?.topSchools || []).forEach((s) => {
      const key = s.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          name: s.trim(),
          category: "school",
          distanceData: findDistance(hyperLocal, s),
        });
      }
    });

    // 4. Named Hospitals
    (hyperLocal?.neighborhood?.topHospitals || []).forEach((h) => {
      const key = h.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          name: h.trim(),
          category: "hospital",
          distanceData: findDistance(hyperLocal, h),
        });
      }
    });

    return list;
  }, [hyperLocal]);

  // Filtered list based on active tab
  const filteredPlaces = useMemo(() => {
    if (activeTab === "all") return unifiedPlaces;
    return unifiedPlaces.filter((p) => p.category === activeTab);
  }, [unifiedPlaces, activeTab]);

  // Handle selecting a place
  const handleSelectPlace = (place: UnifiedPlace) => {
    setSelectedPlace(place);
    setMapInteractive(true);

    // Auto-select optimal mode: if walk meters <= 1500, walk; otherwise drive
    const walkMeters = place.distanceData?.walkMeters;
    if (walkMeters !== undefined && walkMeters <= 1500) {
      setTravelMode("walk");
    } else {
      setTravelMode("drive");
    }
  };

  const handleResetToProperty = () => {
    setSelectedPlace(null);
  };

  // Build embed src for the current selection
  const embedPlace = selectedPlace
    ? {
        name: selectedPlace.name,
        placeId: selectedPlace.placeId || selectedPlace.distanceData?.placeId || "",
      }
    : null;

  const mapSrc = buildEmbedSrc({
    key: embedKey,
    origin,
    place: embedPlace,
    mode: travelMode,
    city,
  });

  const getCategoryIcon = (category: "transit" | "school" | "hospital") => {
    switch (category) {
      case "transit":
        return <Train className="w-4 h-4 text-blue-600" />;
      case "school":
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case "hospital":
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
    }
  };

  const getCategoryLabel = (category: "transit" | "school" | "hospital") => {
    switch (category) {
      case "transit":
        return "Transit";
      case "school":
        return "School";
      case "hospital":
        return "Healthcare";
    }
  };

  const counts = {
    all: unifiedPlaces.length,
    transit: unifiedPlaces.filter((p) => p.category === "transit").length,
    school: unifiedPlaces.filter((p) => p.category === "school").length,
    hospital: unifiedPlaces.filter((p) => p.category === "hospital").length,
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
      {/* Header & Locality Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Hyper-Local Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Location & Commute Guide</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {hyperLocal?.resolvedLocality ? (
              <span className="font-semibold text-slate-700">{hyperLocal.resolvedLocality}</span>
            ) : (
              <span>{origin}</span>
            )}
            {" • "}Verified travel routes to metro stations, schools, and essentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* External Google Maps link */}
          <a
            href={
              selectedPlace?.distanceData
                ? buildDirectionsUrl(origin, selectedPlace.distanceData, travelMode)
                : buildPlaceUrl(origin)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Open in Google Maps for turn-by-turn directions"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
          </a>

          {/* Full-Screen Modal Launcher */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand Map</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { id: "all", label: "All Landmarks", count: counts.all },
            { id: "transit", label: "Metro & Transit", count: counts.transit },
            { id: "school", label: "Top Schools", count: counts.school },
            { id: "hospital", label: "Healthcare", count: counts.hospital },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Two-Column Commute Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Place Cards List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {/* Property Pin Card */}
          <div
            onClick={handleResetToProperty}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              !selectedPlace
                ? "bg-blue-50/90 border-blue-500/50 shadow-xs ring-2 ring-blue-500/20"
                : "bg-slate-50 hover:bg-slate-100 border-slate-100"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  !selectedPlace ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Listing Location
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  The Property Itself
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">
              Pinned
            </span>
          </div>

          {/* Destination Place Cards */}
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, idx) => {
              const isSelected = selectedPlace?.name === place.name;
              const pills = distancePills(place.distanceData);

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectPlace(place)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-500/50 shadow-xs ring-2 ring-blue-500/20"
                      : "bg-slate-50 hover:bg-slate-100/90 border-slate-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
                        {getCategoryIcon(place.category)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {getCategoryLabel(place.category)}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {place.name}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-600 hover:underline shrink-0 pt-1">
                      {isSelected ? "Routing" : "Show Route"}
                    </span>
                  </div>

                  {/* Travel Distance & Time Badges */}
                  {pills.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pl-10.5">
                      {pills.map((pill, pIdx) => {
                        const Icon = pill.mode === "walk" ? Footprints : Car;
                        return (
                          <span
                            key={pIdx}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              isSelected
                                ? "bg-white text-blue-900 border border-blue-200 shadow-xs"
                                : "bg-white text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            <Icon className="w-3 h-3 text-slate-500" />
                            <span>{pill.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No places categorized under this filter.
            </div>
          )}
        </div>

        {/* Right Column: Live Route Map & Mode Bar (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-50">
          {/* Map Controls Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Route className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 truncate">
                {selectedPlace ? `Route: ${selectedPlace.name}` : "Property Location Pin"}
              </span>
            </div>

            {selectedPlace && (
              <div className="flex items-center gap-1 shrink-0">
                {(["walk", "drive"] as const).map((mode) => {
                  const Icon = mode === "walk" ? Footprints : Car;
                  const isActive = travelMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTravelMode(mode)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{mode === "walk" ? "Walking" : "Driving"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map Embed Container */}
          <div className="relative aspect-16/10 sm:aspect-16/9 bg-slate-100">
            <iframe
              key={mapSrc}
              title={
                selectedPlace
                  ? `Route from property to ${selectedPlace.name}`
                  : "Interactive Property Location Map"
              }
              src={mapSrc}
              className="w-full h-full border-0 block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Scroll/Gesture Lock Overlay to prevent accidental page-scroll trap */}
            {!mapInteractive && (
              <button
                type="button"
                onClick={() => setMapInteractive(true)}
                className="absolute inset-0 flex items-end justify-center pb-4 bg-slate-900/10 hover:bg-slate-900/15 backdrop-blur-[1px] transition-colors group cursor-pointer"
                aria-label="Activate interactive map"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 text-slate-800 text-xs font-bold shadow-md group-hover:border-blue-300 group-hover:text-blue-700">
                  <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                  <span>Click to interact with map</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Neighborhood Context Capsule (Vibe, Connectivity, Highways) */}
      {(hyperLocal?.neighborhood?.vibeAndLivability ||
        hyperLocal?.transit?.commuteConnectivity ||
        (hyperLocal?.transit?.majorHighways && hyperLocal.transit.majorHighways.length > 0)) && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {hyperLocal?.neighborhood?.vibeAndLivability && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Neighborhood Vibe & Lifestyle
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {hyperLocal.neighborhood.vibeAndLivability}
              </p>
            </div>
          )}

          {(hyperLocal?.transit?.commuteConnectivity ||
            (hyperLocal?.transit?.majorHighways && hyperLocal.transit.majorHighways.length > 0)) && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Arterial Highways & Connectivity
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-2">
                {hyperLocal?.transit?.commuteConnectivity || "Direct connectivity to key transit corridors."}
              </p>
              {hyperLocal?.transit?.majorHighways && hyperLocal.transit.majorHighways.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {hyperLocal.transit.majorHighways.map((hwy, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold"
                    >
                      🛣️ {hwy}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Map Modal */}
      {isModalOpen && (
        <LocationMapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={hyperLocal ?? null}
          propertyAddress={propertyAddress}
          city={city}
          initialPlaceName={selectedPlace?.name || null}
          initialMode={travelMode}
        />
      )}
    </div>
  );
}
