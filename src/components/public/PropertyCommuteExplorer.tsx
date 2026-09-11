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

      {/* Full-Width Interactive Map Card */}
      <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-50">
        {/* Map Controls Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200/70 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Route className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {selectedPlace ? `Route: ${selectedPlace.name}` : "Property Location Pin"}
            </span>

            {selectedPlace && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                Active Route
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Reset to Property Pin Button */}
            <button
              type="button"
              onClick={handleResetToProperty}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                !selectedPlace
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Property Pin</span>
            </button>

            {/* Travel Mode Switcher */}
            {selectedPlace && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
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
        </div>

        {/* Full-Width Map Embed Container */}
        <div className="relative w-full h-[360px] sm:h-[400px] bg-slate-100">
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
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200 text-slate-800 text-xs font-bold shadow-md group-hover:border-blue-300 group-hover:text-blue-700">
                <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                <span>Click to interact with map</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Landmark Spots Grid (Below the Map) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Nearby Destinations & Travel Times
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredPlaces.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Click any spot to draw route on map
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Property Itself Anchor Card (Shown on All Landmarks tab) */}
          {activeTab === "all" && (
            <div
              onClick={handleResetToProperty}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                !selectedPlace
                  ? "bg-blue-50/90 border-blue-500/60 shadow-xs ring-2 ring-blue-500/20"
                  : "bg-slate-50 hover:bg-slate-100/90 border-slate-200/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      !selectedPlace
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200/80 text-slate-700"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block truncate">
                      Listing Location
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      The Property Itself
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold shrink-0 pt-0.5 ${
                    !selectedPlace ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600"
                  }`}
                >
                  {!selectedPlace ? "Centered" : "Pin"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/50">
                <span className="text-[10px] font-bold text-slate-500">
                  Origin Address
                </span>
                <span className="text-[10px] font-semibold text-blue-600">
                  Base Point
                </span>
              </div>
            </div>
          )}

          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place, idx) => {
              const isSelected = selectedPlace?.name === place.name;
              const pills = distancePills(place.distanceData);

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectPlace(place)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-500/60 shadow-xs ring-2 ring-blue-500/20"
                      : "bg-slate-50 hover:bg-slate-100/90 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
                        {getCategoryIcon(place.category)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          {getCategoryLabel(place.category)}
                        </span>
                        <h4
                          className="text-xs sm:text-sm font-bold text-slate-900 truncate"
                          title={place.name}
                        >
                          {place.name}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold shrink-0 pt-0.5 ${
                        isSelected
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-blue-600"
                      }`}
                    >
                      {isSelected ? "Routing" : "Show Route"}
                    </span>
                  </div>

                  {/* Travel Distance & Time Badges + External Link */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-200/50">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      {pills.length > 0 ? (
                        pills.map((pill, pIdx) => {
                          const Icon = pill.mode === "walk" ? Footprints : Car;
                          return (
                            <span
                              key={pIdx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                isSelected
                                  ? "bg-white text-blue-900 border border-blue-200 shadow-xs"
                                  : "bg-white text-slate-700 border border-slate-200/80"
                              }`}
                            >
                              <Icon className="w-2.5 h-2.5 text-slate-500" />
                              <span>{pill.label}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Verified Landmark
                        </span>
                      )}
                    </div>

                    {/* Direct Google Maps turn-by-turn navigation */}
                    <a
                      href={
                        place.distanceData
                          ? buildDirectionsUrl(origin, place.distanceData, travelMode)
                          : buildPlaceUrl(origin)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                      title="Open turn-by-turn directions in Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
              No places categorized under this filter.
            </div>
          )}
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
