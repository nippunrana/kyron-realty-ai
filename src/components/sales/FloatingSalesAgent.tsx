"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BASE_PATH } from "@/lib/base-path";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import { GsapSearchHub, type SearchHubProperty } from "./GsapSearchHub";
import { SalesDialogueStream } from "./SalesDialogueStream";
import {
  Mic,
  MicOff,
  PhoneOff,
  X,
  Radio,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface PageContextInfo {
  pageTitle: string;
}

/**
 * Derives current page title for light-weight context badge
 */
function getPageContext(pathname: string): PageContextInfo {
  if (pathname.startsWith("/listings/")) {
    const slug = pathname.replace(/^\/listings\//, "").split("/")[0];
    const formatted = slug
      ? slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Listing Detail";
    return { pageTitle: formatted };
  }
  if (pathname.startsWith("/listings")) {
    return { pageTitle: "Property Directory" };
  }
  if (pathname.startsWith("/login")) {
    return { pageTitle: "Sign In" };
  }
  if (pathname.startsWith("/privacy") || pathname.startsWith("/terms")) {
    return { pageTitle: "Legal Policies" };
  }
  return { pageTitle: "Home Showcase" };
}

interface PropertySearchParams {
  city?: string;
  petFriendly?: boolean;
  bedrooms?: number;
  listingType?: "rent" | "sale";
  minPrice?: number;
  maxPrice?: number;
  reset?: "filters" | "all";
  query?: string;
  userSpeech?: string;
  /**
   * Whether this search reports its results back to Sarah as a [SEARCH_RESULT:] cue.
   * False for the speculative search fired off the caller's own speech: that one exists
   * to open the hub early, and Sarah has not acknowledged anything yet to announce.
   * Her own [SEARCH:] tag is what earns the single spoken result.
   */
  announce?: boolean;
}

/** Strips the separators that structure a cue tag, so a title can never truncate or re-key it. */
function sanitizeCueText(value: string): string {
  return value.replace(/[[\]|;,=]/g, " ").replace(/\s{2,}/g, " ").trim();
}

/**
 * The numbered read-back of the hub Sarah gets with every result cue, ordered and numbered
 * exactly as the cards render. It is what lets her resolve both "open search result 2" and
 * "the 4 BHK one", and say enough about the match for the caller to confirm it.
 */
function buildResultsDigest(properties: SearchHubProperty[]): string {
  return properties
    .map((prop, index) => {
      const priceNum = typeof prop.price === "string" ? parseFloat(prop.price) : prop.price;
      const parts = [sanitizeCueText(prop.title)];
      if (prop.bedrooms) parts.push(`${prop.bedrooms} BHK`);
      if (!isNaN(priceNum) && priceNum > 0) {
        parts.push(`${Math.round(priceNum)} rupees${prop.listingType === "rent" ? " per month" : ""}`);
      }
      if (prop.city) parts.push(sanitizeCueText(prop.city));
      return `${index + 1}:${parts.join("|")}`;
    })
    .join(";");
}

export function FloatingSalesAgent() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Exit confirmation states
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Dashboard navigation interception states
  const [showDashboardAlert, setShowDashboardAlert] = useState(false);
  const [pendingDashboardHref, setPendingDashboardHref] = useState<string | null>(null);

  const context = useMemo(() => getPageContext(pathname), [pathname]);
  const avatarUrl = `${BASE_PATH}/images/salesagent.webp`;

  // Search Hub states
  const [isSearchHubOpen, setIsSearchHubOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "search">("chat");
  const [isSearchingProperties, setIsSearchingProperties] = useState(false);
  const [activeSearchCity, setActiveSearchCity] = useState<string | null>(null);
  const [isPetFriendlyFilter, setIsPetFriendlyFilter] = useState(false);
  const [activeSearchCriteria, setActiveSearchCriteria] = useState<{
    city: string | null;
    petFriendly: boolean | null;
    bedrooms: number | null;
    listingType: "rent" | "sale" | null;
    minPrice: number | null;
    maxPrice: number | null;
  }>({
    city: null,
    petFriendly: null,
    bedrooms: null,
    listingType: null,
    minPrice: null,
    maxPrice: null,
  });
  const activeSearchCriteriaRef = useRef(activeSearchCriteria);
  useEffect(() => {
    activeSearchCriteriaRef.current = activeSearchCriteria;
  }, [activeSearchCriteria]);

  const [searchResults, setSearchResults] = useState<SearchHubProperty[]>([]);
  const searchResultsRef = useRef(searchResults);
  useEffect(() => {
    searchResultsRef.current = searchResults;
  }, [searchResults]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const processedSearchTurnsRef = useRef<Set<string>>(new Set());
  const triggerSearchRef = useRef<((params: PropertySearchParams) => Promise<void>) | null>(null);

  const {
    callState,
    isCallActive,
    isMuted,
    isAgentSpeaking,
    audioFrequencies,
    transcript,
    errorMessage,
    startCall,
    toggleMute,
    endCall,
    sendTextMessage,
  } = useAgoraVoiceAgent({
    onSearchRequest: (params) => {
      const criteriaSig = `${params.city || ""}_${params.pets}_${params.bedrooms}_${params.listingType || ""}_${params.reset || ""}`;
      const searchKey = `req_${transcript.length}_${criteriaSig}`;
      if (processedSearchTurnsRef.current.has(searchKey)) return;
      processedSearchTurnsRef.current.add(searchKey);
      executePropertySearch({
        city: params.city,
        petFriendly: params.pets,
        bedrooms: params.bedrooms,
        listingType: params.listingType,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        reset: params.reset,
        query: params.query,
      });
    },
    onOpenPropertyRequest: (index) => {
      const target = searchResultsRef.current[index - 1];
      if (!target?.slug) return;
      // Collapse the hub before navigating: its 75% focus overlay is tied to isSearchHubOpen
      // and would black out the listing page the caller just asked to see.
      setIsSearchHubOpen(false);
      setMobileTab("chat");
      router.push(`/listings/${target.slug}`);
    },
    onUIAction: (action) => {
      if (action === "open_search_hub") {
        setIsSearchHubOpen(true);
        setMobileTab("search");
      } else if (action === "close_search_hub") {
        setIsSearchHubOpen(false);
        setMobileTab("chat");
      }
    },
    onAgentTurnComplete: (currentTranscript) => {
      // Sarah's own [SEARCH:] tag is handled once by onSearchRequest, which fires from the
      // same transcript stream a turn earlier. Re-scanning it here only duplicated the search.

      // User Turn Fast-Path: If user provides city or refinement speech, trigger search in parallel
      const lastMsg = currentTranscript[currentTranscript.length - 1];
      if (lastMsg && lastMsg.role === "user" && lastMsg.text) {
        const cityMatch = lastMsg.text.match(/\b(faridabad|delhi|gurugram|gurgaon|noida|bangalore|bengaluru|mumbai|pune|hyderabad|chennai|kolkata)\b/i);
        const isRefinementIntent = /\b(pet|pets|bhk|bedroom|rent|sale|clear filter|reset filter)\b/i.test(lastMsg.text);
        // "Open the 4 BHK one" reads as a refinement to the patterns above, and re-running the
        // search would renumber the cards between Sarah's confirmation and the caller's yes -
        // so result 2 would open a different home. Asking to open something is never a search.
        const isOpenIntent = /\b(open|take me to|go to|result\s*(number\s*)?\d+|number\s*\d+)\b/i.test(lastMsg.text);
        if (!isOpenIntent && (cityMatch || isRefinementIntent)) {
          const city = cityMatch ? cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase() : undefined;
          const searchKey = `user_${lastMsg.id || currentTranscript.length}_${city || "active"}_${lastMsg.text.slice(0, 20)}`;
          if (!processedSearchTurnsRef.current.has(searchKey)) {
            processedSearchTurnsRef.current.add(searchKey);
            triggerSearchRef.current?.({
              city,
              userSpeech: lastMsg.text,
              announce: false,
            });
          }
        }
      }
    },
  });

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const executePropertySearch = useCallback(
    async (params: PropertySearchParams) => {
      setIsSearchingProperties(true);
      setIsSearchHubOpen(true);
      setMobileTab("search");

      try {
        const prev = activeSearchCriteriaRef.current;
        let mergedCity = params.city || prev.city || null;
        let mergedPetFriendly = prev.petFriendly;
        let mergedBedrooms = prev.bedrooms;
        let mergedListingType = prev.listingType;
        let mergedMinPrice = prev.minPrice;
        let mergedMaxPrice = prev.maxPrice;

        if (params.reset === "all") {
          mergedCity = null;
          mergedPetFriendly = null;
          mergedBedrooms = null;
          mergedListingType = null;
          mergedMinPrice = null;
          mergedMaxPrice = null;
        } else if (params.reset === "filters") {
          // Keep active city, clear specific filters
          mergedPetFriendly = null;
          mergedBedrooms = null;
          mergedListingType = null;
          mergedMinPrice = null;
          mergedMaxPrice = null;
        } else {
          if (params.city && params.city.toLowerCase() !== prev.city?.toLowerCase()) {
            mergedCity = params.city;
          }
          if (params.petFriendly !== undefined) {
            mergedPetFriendly = params.petFriendly;
          }
          if (params.bedrooms !== undefined) {
            mergedBedrooms = params.bedrooms;
          }
          if (params.listingType !== undefined) {
            mergedListingType = params.listingType;
          }
          if (params.minPrice !== undefined) {
            mergedMinPrice = params.minPrice;
          }
          if (params.maxPrice !== undefined) {
            mergedMaxPrice = params.maxPrice;
          }
        }

        const mergedCriteria = {
          city: mergedCity,
          petFriendly: mergedPetFriendly,
          bedrooms: mergedBedrooms,
          listingType: mergedListingType,
          minPrice: mergedMinPrice,
          maxPrice: mergedMaxPrice,
        };

        const speech =
          params.userSpeech ||
          params.query ||
          `${mergedPetFriendly ? "pet-friendly " : ""}${mergedBedrooms ? `${mergedBedrooms} BHK ` : ""}properties in ${mergedCity || ""}`;

        const res = await fetch(`${BASE_PATH}/api/properties/sales-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userSpeech: speech,
            transcriptHistory: transcriptRef.current.slice(-6).map((m) => ({ role: m.role, text: m.text })),
            activeCriteria: mergedCriteria,
          }),
        });

        const data = await res.json();
        if (data.success) {
          if (data.availableCities) setAvailableCities(data.availableCities);

          if (data.missingCity) {
            setActiveSearchCity(null);
            setActiveSearchCriteria((c) => ({ ...c, city: null }));
          } else {
            const resolvedCity = data.criteria?.city || mergedCity || null;
            const resolvedPets = data.criteria?.petFriendly ?? mergedPetFriendly;
            const resolvedBeds = data.criteria?.bedrooms ?? mergedBedrooms;
            const resolvedType = data.criteria?.listingType ?? mergedListingType;

            const updatedCriteria = {
              city: resolvedCity,
              petFriendly: resolvedPets,
              bedrooms: resolvedBeds,
              listingType: resolvedType,
              minPrice: data.criteria?.minPrice ?? mergedMinPrice,
              maxPrice: data.criteria?.maxPrice ?? mergedMaxPrice,
            };

            setActiveSearchCity(resolvedCity);
            setIsPetFriendlyFilter(Boolean(resolvedPets));
            setActiveSearchCriteria(updatedCriteria);
            setSearchResults(data.properties || []);

            // Re-sync back to Sarah over Agora RTM so she announces findings
            if (isCallActive && data.properties && params.announce !== false) {
              const count = data.properties.length;
              const results = buildResultsDigest(data.properties as SearchHubProperty[]);

              const filterDescs: string[] = [];
              if (resolvedPets) filterDescs.push("pet-friendly");
              if (resolvedBeds) filterDescs.push(`${resolvedBeds} BHK`);
              if (resolvedType) filterDescs.push(resolvedType);
              const filterSummary = filterDescs.length > 0 ? filterDescs.join(" ") + " homes" : "properties";

              const cue = `[SEARCH_RESULT:city=${resolvedCity || ""},count=${count},filters=${filterSummary},results=${results}]`;
              // The search finishes while Sarah is still speaking her acknowledgment beat.
              // APPEND hands the queueing to the Agora gateway, which knows when her
              // interaction actually ends; the client's own speaking flag does not, because
              // it flips false during the gateway's "thinking" phase.
              sendTextMessage(cue, { priority: "append" });
            }
          }
        }
      } catch (err) {
        console.error("[SalesAgent] Search execution failed:", err);
      } finally {
        setIsSearchingProperties(false);
      }
    },
    [isCallActive, sendTextMessage]
  );

  // Clean up search deduplication on call termination
  useEffect(() => {
    if (!isCallActive) {
      processedSearchTurnsRef.current.clear();
    }
  }, [isCallActive]);

  useEffect(() => {
    triggerSearchRef.current = executePropertySearch;
  });

  const desktopSearchWingRef = useRef<HTMLDivElement>(null);

  const handleCollapseSearch = useCallback(() => {
    setIsSearchHubOpen(false);
    setMobileTab("chat");
  }, [setIsSearchHubOpen, setMobileTab]);

  useGSAP(
    () => {
      const el = desktopSearchWingRef.current;
      if (!el) return;

      if (isSearchHubOpen) {
        gsap.killTweensOf(el);
        el.style.display = "flex";
        gsap.fromTo(
          el,
          {
            width: 0,
            opacity: 0,
            x: 24,
          },
          {
            width: 560,
            opacity: 1,
            x: 0,
            duration: 0.45,
            ease: "power3.out",
          }
        );
      } else {
        gsap.killTweensOf(el);
        gsap.to(el, {
          width: 0,
          opacity: 0,
          x: 24,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => {
            if (el) el.style.display = "none";
          },
        });
      }
    },
    { dependencies: [isSearchHubOpen] }
  );

  const isDashboardRoute = pathname.startsWith("/dashboard");

  // If user enters dashboard while call was active, tear down call immediately
  useEffect(() => {
    if (isDashboardRoute && isCallActive) {
      endCall();
    }
  }, [isDashboardRoute, isCallActive, endCall]);

  // Intercept any client clicks to /dashboard links during an active call
  useEffect(() => {
    if (!isCallActive) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const cleanHref = href.replace(BASE_PATH, "");
      if (cleanHref === "/dashboard" || cleanHref.startsWith("/dashboard/")) {
        e.preventDefault();
        e.stopPropagation();
        setPendingDashboardHref(href);
        setShowDashboardAlert(true);
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [isCallActive]);

  // Microphone pre-flight check before initiating billed Agora session
  const handleStartCall = useCallback(async () => {
    setPermissionError(null);
    setIsRequestingMic(true);

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setIsRequestingMic(false);
      setPermissionError("Microphone permission was denied. Please allow microphone access in your browser to speak with Sarah.");
      return;
    }

    setIsRequestingMic(false);
    await startCall(undefined, undefined, "sales_agent");
  }, [startCall]);

  // Request close or disconnect with confirmation check
  const handleRequestDisconnect = useCallback(() => {
    if (isCallActive) {
      setShowExitConfirm(true);
    } else {
      setIsOpen(false);
      setIsSearchHubOpen(false);
      setMobileTab("chat");
    }
  }, [isCallActive, setMobileTab, setIsSearchHubOpen]);

  // Confirmed disconnect
  const handleConfirmDisconnect = useCallback(async () => {
    setShowExitConfirm(false);
    setIsSearchHubOpen(false);
    setMobileTab("chat");
    await endCall();
    setIsOpen(false);
  }, [endCall, setMobileTab, setIsSearchHubOpen]);

  // Dashboard navigation confirmation handlers
  const handleConfirmDashboardNav = useCallback(async () => {
    setShowDashboardAlert(false);
    await endCall();
    if (pendingDashboardHref) {
      router.push(pendingDashboardHref);
    }
  }, [endCall, pendingDashboardHref, router]);

  const handleCancelDashboardNav = useCallback(() => {
    setShowDashboardAlert(false);
    setPendingDashboardHref(null);
  }, []);

  // When inside the dashboard, Sarah is completely hidden and not rendered
  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* DASHBOARD NAVIGATION ALERT MODAL                                         */}
      {/* ========================================================================= */}
      {showDashboardAlert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard Navigation Alert"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Disconnect Call with Sarah?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Navigating to the Owner Dashboard will end your live call. The sales advisor is not accessible inside the dashboard workspace.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmDashboardNav}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Disconnect &amp; Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelDashboardNav}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 75% BLACK FOCUS OVERLAY (Click-barrier behind active search & chat pod)   */}
      {/* ========================================================================= */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-black/75 z-30 transition-opacity duration-300 pointer-events-auto ${
          isSearchHubOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ========================================================================= */}
      {/* FLOATING SALES AGENT WIDGET                                              */}
      {/* ========================================================================= */}
      <aside
        aria-label="Kyron Sales Voice Agent"
        className="fixed bottom-5 right-5 z-40 select-none font-sans"
      >
        {/* ========================================================================= */}
        {/* LIGHT-MODE VOICE POD (Expanded)                                           */}
        {/* ========================================================================= */}
        {isOpen && (
          <div className="mb-3 flex items-end gap-3 max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-40px)]">
            {/* 1. LEFT WING (Desktop): Search Hub that fluidly expands to the left */}
            <div
              ref={desktopSearchWingRef}
              className="hidden md:flex h-[560px] sm:h-[620px] overflow-hidden shrink-0"
              style={{ display: "none", width: 0, opacity: 0 }}
            >
              <GsapSearchHub
                isOpen={isSearchHubOpen}
                isSearching={isSearchingProperties}
                activeCity={activeSearchCity}
                isPetFriendlyFilter={isPetFriendlyFilter}
                activeBedrooms={activeSearchCriteria.bedrooms}
                activeListingType={activeSearchCriteria.listingType}
                activeMaxPrice={activeSearchCriteria.maxPrice}
                properties={searchResults}
                availableCities={availableCities}
                onClose={handleCollapseSearch}
              />
            </div>

            {/* 2. RIGHT WING: Sarah Voice Chat Pod (or Mobile Unified Pod) */}
            <div
              className={`bg-white/95 border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-900/15 backdrop-blur-xl text-slate-900 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200 transition-all ${
                isCallActive
                  ? "w-[min(92vw,380px)] h-[min(84vh,620px)] sm:h-[620px]"
                  : "w-[min(90vw,340px)]"
              }`}
            >
              {isCallActive ? (
                /* ========================================================================= */
                /* 1. ACTIVE CALL VIEW: Compact Persona Bar + Live Dialogue Stream + Controls */
                /* ========================================================================= */
                <>
                  {/* Compact Sticky Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
                    {/* Left: Avatar + Speaking Beacon + Identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`relative w-10 h-10 rounded-2xl overflow-hidden p-0.5 shrink-0 transition-all duration-300 ${
                          isAgentSpeaking
                            ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                            : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm"
                        }`}
                      >
                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-100 relative">
                          <Image
                            src={avatarUrl}
                            alt="Sarah AI Sales Advisor"
                            fill
                            sizes="40px"
                            unoptimized={true}
                            className="object-cover"
                          />
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            isAgentSpeaking ? "bg-emerald-500 animate-pulse" : "bg-blue-600"
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            Sarah
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            LIVE
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 block truncate">
                          {isAgentSpeaking
                            ? "Sarah is speaking..."
                            : callState === "user_speaking"
                            ? "Listening hands-free..."
                            : callState === "connecting"
                            ? "Connecting..."
                            : isMuted
                            ? "Microphone muted"
                            : "Listening • Speak naturally"}
                        </span>
                      </div>
                    </div>

                    {/* Center: Live Soundwave (Visible on sm+ screens) */}
                    <div className="hidden sm:flex items-center gap-0.5 h-4 px-2 py-1 rounded-lg bg-slate-100/80 shrink-0">
                      {audioFrequencies.slice(0, 8).map((freq, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            isAgentSpeaking
                              ? "bg-emerald-500"
                              : callState === "user_speaking"
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                          style={{
                            height: `${Math.max(
                              25,
                              Math.min(
                                100,
                                isAgentSpeaking || callState === "user_speaking" ? freq : 25
                              )
                            )}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Right: Listings Shortcut Pill + Mute & Close */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {searchResults.length > 0 && !isSearchHubOpen && (
                        <button
                          type="button"
                          onClick={() => setIsSearchHubOpen(true)}
                          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                          title="Re-open property search panel"
                        >
                          <span>📍 {searchResults.length}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isMuted
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                      >
                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleRequestDisconnect}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        aria-label="Close or disconnect voice assistant"
                        title="Close or disconnect"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Segmented Switcher (Visible only on mobile when listings exist or search active) */}
                  {(searchResults.length > 0 || isSearchHubOpen) && (
                    <div className="md:hidden px-3 py-1.5 bg-slate-100/90 border-b border-slate-200/60 flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileTab("chat")}
                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                          mobileTab === "chat"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        💬 Conversation
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileTab("search")}
                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          mobileTab === "search"
                            ? "bg-white text-blue-600 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>🏠 Properties</span>
                        {searchResults.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                            {searchResults.length}
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Body: Mobile Search Tab (mobile-only) and Dialogue Stream (always on desktop, toggleable on mobile) */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Mobile Search View (visible only on screens < md when mobileTab === 'search') */}
                    {mobileTab === "search" && (
                      <div className="md:hidden flex-1 overflow-hidden flex flex-col min-h-0">
                        <GsapSearchHub
                          isOpen={true}
                          isSearching={isSearchingProperties}
                          activeCity={activeSearchCity}
                          isPetFriendlyFilter={isPetFriendlyFilter}
                          activeBedrooms={activeSearchCriteria.bedrooms}
                          activeListingType={activeSearchCriteria.listingType}
                          activeMaxPrice={activeSearchCriteria.maxPrice}
                          properties={searchResults}
                          availableCities={availableCities}
                          onClose={() => setMobileTab("chat")}
                          isMobileTab={true}
                        />
                      </div>
                    )}

                    {/* Dialogue Stream: ALWAYS visible on desktop (md:flex), hidden on mobile when mobileTab === 'search' */}
                    <div
                      className={`flex-1 overflow-hidden flex flex-col min-h-0 ${
                        mobileTab === "search" ? "hidden md:flex" : "flex"
                      }`}
                    >
                      <SalesDialogueStream
                        transcript={transcript}
                        isAgentSpeaking={isAgentSpeaking}
                        callState={callState}
                      />
                    </div>
                  </div>

                {/* Exit Confirmation View (Inline) or Bottom Bar */}
                {showExitConfirm ? (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center animate-in fade-in duration-150 shrink-0">
                    <p className="text-xs font-bold text-slate-900 mb-1">
                      Are you sure you want to end this call?
                    </p>
                    <p className="text-[11px] text-slate-500 mb-2.5">
                      Ending the call will stop the Agora voice session.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmDisconnect}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Yes, End Call
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowExitConfirm(false)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Keep Talking
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      <span>Agora SD-RTN • Hands-free</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestDisconnect}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="End Conversation / Disconnect"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ========================================================================= */
              /* 2. IDLE WELCOMING CARD: Persona Info + Start Button                       */
              /* ========================================================================= */
              <>
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-blue-500/20 shadow-sm shrink-0">
                      <Image
                        src={avatarUrl}
                        alt="Sarah AI Sales Advisor"
                        fill
                        sizes="40px"
                        unoptimized={true}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sarah</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium">
                          <span>Ready</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        AI Sales &amp; Leasing Associate
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRequestDisconnect}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close voice assistant"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body: Voice Arena */}
                <div className="p-6 flex flex-col items-center text-center">
                  {/* Context Badge */}
                  <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-[11px] font-medium">
                    <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span>Viewing: {context.pageTitle}</span>
                  </div>

                  {/* Central Voice Avatar */}
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-xl ring-4 ring-slate-100 shadow-slate-200">
                      <Image
                        src={avatarUrl}
                        alt="Sarah AI Sales Advisor"
                        fill
                        sizes="96px"
                        unoptimized={true}
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Dynamic Status Text */}
                  <div className="mb-4 min-h-[38px] flex flex-col items-center justify-center">
                    {isRequestingMic ? (
                      <p className="text-xs font-semibold text-blue-600 animate-pulse">
                        Requesting microphone permission...
                      </p>
                    ) : callState === "connecting" ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span>Connecting to Sarah via Agora...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">
                        Tap below to start voice conversation
                      </p>
                    )}
                  </div>

                  {/* Error or Permission Alert */}
                  {(permissionError || errorMessage) && (
                    <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5 text-left w-full">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{permissionError || errorMessage}</span>
                    </div>
                  )}

                  {/* Start Button */}
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isRequestingMic || callState === "connecting"}
                      onClick={handleStartCall}
                      className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{callState === "connecting" ? "Connecting..." : "Start Conversation"}</span>
                    </button>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/70 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Sub-300ms real-time voice • Agora &amp; Gemini</span>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESTING FLOATING PILL (Light Mode Luxury)                                 */}
        {/* ========================================================================= */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`group relative flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/95 hover:bg-white border text-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl ${
            isCallActive
              ? "border-emerald-400 ring-2 ring-emerald-400/30"
              : "border-slate-200 hover:border-blue-300 ring-1 ring-slate-100"
          }`}
        >
          {/* Avatar with Live Indicator */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-400 transition-all shrink-0">
            <Image
              src={avatarUrl}
              alt="Sarah AI Sales Advisor"
              fill
              sizes="36px"
              unoptimized={true}
              className="object-cover"
            />
            {/* Pulsing online/active badge */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                isCallActive ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
          </div>

          {/* Info Text */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Sarah
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                • Sales AI
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCallActive ? "bg-emerald-500 animate-ping" : "bg-blue-500"
                }`}
              />
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[150px]">
                {isCallActive ? "In Call • Speaking" : context.pageTitle}
              </span>
            </div>
          </div>

          {/* Mic Indicator */}
          <div className="ml-1 text-slate-400 group-hover:text-blue-600 transition-colors">
            <Mic className="w-3.5 h-3.5" />
          </div>
        </div>
      </aside>
    </>
  );
}
