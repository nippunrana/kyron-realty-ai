"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { ConversationalPanel, type VoiceControlState } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ReviewSpecsModal } from "./ReviewSpecsModal";
import { ImageUploadModal } from "./ImageUploadModal";
import type { HyperLocalKbData } from "@/db/schema";
import { TelemetryHUD, type TelemetryLogEvent } from "./TelemetryHUD";
import { areCoreSpecsVerified } from "./inspector-specs";
import {
  captureEntryLayout,
  fadeBackdrop,
  playEntryLayout,
  FLIP_ATTR,
  INSPECTOR_STAGE_CLASSES,
  PANEL_STAGE_CLASSES,
  type EntryStage,
  type EntryLayoutSnapshot,
} from "./entry-choreography";
import type { UIAction } from "@/hooks/voice-agent-types";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import type { TurnMessage, PillLabels } from "@/lib/turn-extractor";
import { computeFloorPrice } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";

const emptyInitialDraftState: ExtractedPropertyPayload = {
  property: {
    title: "",
    slug: "",
    description: "",
    listingType: "",
    propertyType: "",
    price: 0,
    securityDeposit: 0,
    minLeaseMonths: 12,
    hoaFeeMonthly: 0,
    address: "",
    unitNumber: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    floorNumber: null,
    storeys: null,
    rentScope: "",
    washrooms: null,
    furnishingStatus: "",
    yearBuilt: 0,
    amenities: [],
    features: [],
    coverImageUrl: "",
    images: [],
  },
  knowledgeBase: {
    rawScrapedMarkdown: "",
    synthesizedSalesPitch: "",
    neighborhoodSummary: "",
    schoolDistrictInfo: "",
    petPolicyDetail: "",
    parkingDetail: "",
    utilitiesDetail: "",
    applicationProcess: "",
    faqs: [],
    agentTone: "warm_professional",
    greetingMessage: "",
  },
  negotiationMatrix: {
    allowNegotiation: true,
    targetPrice: 0,
    minFloorPrice: 0,
    maxAllowedDiscountPct: 5.0,
    concessionRules: [],
    notesForAgent: "",
  },
};

interface OnboardingStudioProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  initialDraftId?: number;
}

/**
 * The location search is one real-world Maps fetch. A second is spent only when the first
 * came back with nothing the owner could confirm - never to refresh a result that landed.
 */
const MAX_ENRICHMENT_ATTEMPTS = 2;
const ENRICHMENT_RETRY_DELAY_MS = 2500;

/**
 * Did the research name a real place? `resolvedLocality` and `grounded` are trust labels, not
 * evidence: the structuring call can resolve a locality from the address string alone when the
 * Maps research came back empty, so only researched places count as a usable result.
 */
function isUsableHyperLocalResult(data: HyperLocalKbData | null): boolean {
  if (!data) return false;
  return Boolean(
    data.transit?.nearestMetro ||
      data.transit?.majorHighways?.length ||
      data.neighborhood?.topSchools?.length ||
      data.neighborhood?.topHospitals?.length
  );
}

/**
 * Off-topic turns tolerated before the studio hangs up. Elena warns on the first two from
 * her own judgment; this count is the authority on when the third has arrived, because it
 * lives here rather than in a conversation the caller is actively trying to derail.
 * Strikes do not decay: an owner who ignores two explicit warnings has had fair notice.
 */
const MAX_OFF_TOPIC_STRIKES = 3;

const CONDUCT_NOTICE =
  "This call was ended because the conversation moved away from listing the property. You can start again whenever you're ready.";

/** Long enough for a spoken sign-off to land, short enough to stop a caller talking on. */
const CONDUCT_HANGUP_GRACE_MS = 4000;

const HUD_STORAGE_KEY = "kyron_telemetry_hud_open";
let hudListeners: Array<() => void> = [];

function subscribeHud(callback: () => void) {
  hudListeners.push(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    hudListeners = hudListeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function getHudSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(HUD_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function getHudServerSnapshot(): boolean {
  return false;
}

function setHudStore(open: boolean): void {
  try {
    localStorage.setItem(HUD_STORAGE_KEY, String(open));
  } catch {}
  hudListeners.forEach((l) => l());
}

export function OnboardingStudio({ user, initialDraftId }: OnboardingStudioProps) {
  const [data, setData] = useState<ExtractedPropertyPayload>(() => ({
    ...emptyInitialDraftState,
    knowledgeBase: {
      ...emptyInitialDraftState.knowledgeBase,
      contactEmail: user?.email || "",
    },
  }));
  const [pillLabels, setPillLabels] = useState<PillLabels>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [isTurnSyncing, setIsTurnSyncing] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<"core" | "additional_specs" | "photos" | "final_review">("core");
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hyperLocalData, setHyperLocalData] = useState<HyperLocalKbData | null>(null);
  const hyperLocalDataRef = useRef<HyperLocalKbData | null>(null);
  const [isEnrichingLocation, setIsEnrichingLocation] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const isEnrichingLocationRef = useRef(false);
  const [enrichmentAttempt, setEnrichmentAttempt] = useState(0);
  const enrichmentAttemptsRef = useRef(0);
  const [draftId, setDraftId] = useState<number | null>(initialDraftId || null);
  const [uploadToken, setUploadToken] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [qrCodeSvg, setQrCodeSvg] = useState("");
  const draftIdRef = useRef<number | null>(initialDraftId || null);
  const [voiceControl, setVoiceControl] = useState<VoiceControlState | null>(null);

  const offTopicStrikesRef = useRef(0);
  const conductTerminatedRef = useRef(false);
  const conductHangupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [conductNotice, setConductNotice] = useState<string | null>(null);

  const [entryStage, setEntryStage] = useState<EntryStage>("intro");
  const entryStageRef = useRef<EntryStage>("intro");
  const entryLayoutRef = useRef<EntryLayoutSnapshot | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  /**
   * The old geometry has to be measured before React commits the new one, so every stage
   * change goes through here rather than calling `setEntryStage` directly.
   */
  const advanceEntryStage = useCallback((next: EntryStage) => {
    if (entryStageRef.current === next) return;
    entryLayoutRef.current = captureEntryLayout();
    entryStageRef.current = next;
    setEntryStage(next);
  }, []);

  useLayoutEffect(() => {
    playEntryLayout(entryLayoutRef.current, entryStage);
    entryLayoutRef.current = null;
    fadeBackdrop(backdropRef.current, entryStage !== "split");
  }, [entryStage]);

  /**
   * The inspector arrives when the first turn extraction settles - the honest edge for
   * "Gemini has looked at the answer". `isTurnSyncing` is cleared in a `finally`, so a
   * timeout or a failed extraction reveals the inspector too; the pane is never stranded
   * off-screen waiting for a result that is not coming.
   */
  const wasTurnSyncingRef = useRef(false);
  useEffect(() => {
    if (wasTurnSyncingRef.current && !isTurnSyncing && entryStageRef.current === "focused") {
      advanceEntryStage("split");
    }
    wasTurnSyncingRef.current = isTurnSyncing;
  }, [isTurnSyncing, advanceEntryStage]);

  const voiceControlRef = useRef<VoiceControlState | null>(null);
  const voiceSessionIdsRef = useRef<Set<number>>(new Set());
  const isDeployClosingRef = useRef(false);
  const deployClosingResolveRef = useRef<(() => void) | null>(null);
  const handlePublishRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleVoiceStateSync = useCallback((state: VoiceControlState) => {
    voiceControlRef.current = state;
    if (state.voiceSessionId) {
      voiceSessionIdsRef.current.add(state.voiceSessionId);
    }
    setVoiceControl(state);
  }, []);

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEvent[]>([]);
  const [sessionUsage, setSessionUsage] = useState({
    promptTokens: 0,
    candidateTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    agoraDurationSeconds: 0,
    mapsGroundingQueries: 0,
    routesMatrixElements: 0,
    routesApiRequests: 0,
  });

  // Track live Agora Conversational AI duration while call is active
  useEffect(() => {
    if (!voiceControl?.isCallActive) return;
    const timer = setInterval(() => {
      setSessionUsage((prev) => ({
        ...prev,
        agoraDurationSeconds: (prev.agoraDurationSeconds || 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [voiceControl?.isCallActive]);
  const isHudOpen = useSyncExternalStore(subscribeHud, getHudSnapshot, getHudServerSnapshot);

  const toggleHud = () => {
    setHudStore(!getHudSnapshot());
  };

  const addTelemetryLog = useCallback(
    (
      category: TelemetryLogEvent["category"],
      title: string,
      details?: any,
      latencyMs?: number,
      level: TelemetryLogEvent["level"] = "info"
    ) => {
      const newEvent: TelemetryLogEvent = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
        }),
        category,
        title,
        details,
        latencyMs,
        level,
      };

      setTelemetryLogs((prev) => [newEvent, ...prev].slice(0, 150));
    },
    []
  );

  /**
   * Hangs up. `immediate` is Elena having just said her sign-off out loud; otherwise this is
   * the backstop firing on the strike count alone, and it waits a beat so a sign-off she is
   * still speaking can finish. Either way it latches, so the end-of-call synthesis is skipped
   * - spending a Gemini call summarising a transcript we are rejecting is the exact waste the
   * guardrail exists to stop.
   */
  const terminateForConduct = useCallback((immediate: boolean, reason: string) => {
    if (conductTerminatedRef.current) return;
    conductTerminatedRef.current = true;
    setConductNotice(CONDUCT_NOTICE);
    addTelemetryLog(
      "INTENT",
      `Conduct guardrail: ending call (${reason})`,
      { strikes: offTopicStrikesRef.current, immediate },
      undefined,
      "warn"
    );

    const hangUp = () => {
      conductHangupTimerRef.current = null;
      voiceControlRef.current?.endCall().catch(() => {});
    };

    if (immediate) hangUp();
    else conductHangupTimerRef.current = setTimeout(hangUp, CONDUCT_HANGUP_GRACE_MS);
  }, [addTelemetryLog]);

  useEffect(
    () => () => {
      if (conductHangupTimerRef.current) clearTimeout(conductHangupTimerRef.current);
    },
    []
  );


  // Resume / populate existing draft listing if initialDraftId is provided
  useEffect(() => {
    if (!initialDraftId) return;

    let isMounted = true;
    async function loadDraftListing() {
      try {
        addTelemetryLog("STATE-UPDATE", `Loading existing draft listing #${initialDraftId}...`);
        const res = await fetch(`${BASE_PATH}/api/properties/${initialDraftId}`);
        const result = await res.json();

        if (!res.ok || !result.success || !result.property) {
          throw new Error(result.error || "Failed to load draft listing.");
        }

        if (!isMounted) return;
        const prop = result.property;
        const kb = result.knowledgeBase;
        const matrix = result.negotiationMatrix;

        setDraftId(prop.id);
        draftIdRef.current = prop.id;

        if (prop.uploadToken) {
          setUploadToken(prop.uploadToken);
          const host = window.location.host;
          const protocol = window.location.protocol;
          const url = `${protocol}//${host}${BASE_PATH}/properties/upload/${prop.id}?token=${prop.uploadToken}`;
          setUploadUrl(url);
        }

        if (prop.qrCodeSvg) {
          setQrCodeSvg(prop.qrCodeSvg);
        }

        setData((prev) => ({
          property: {
            ...prev.property,
            title: prop.title || prev.property.title,
            slug: prop.slug || prev.property.slug,
            description: prop.description || prev.property.description,
            listingType: prop.listingType || prev.property.listingType,
            propertyType: prop.propertyType || prev.property.propertyType,
            price: Number(prop.price) || 0,
            securityDeposit: Number(prop.securityDeposit) || 0,
            minLeaseMonths: prop.minLeaseMonths ?? 12,
            hoaFeeMonthly: Number(prop.hoaFeeMonthly) || 0,
            address: prop.address || prev.property.address,
            unitNumber: prop.unitNumber || "",
            city: prop.city || "",
            state: prop.state || "",
            zipCode: prop.zipCode || "",
            country: prop.country || "India",
            bedrooms: prop.bedrooms ?? 0,
            bathrooms: Number(prop.bathrooms) || 0,
            sqft: prop.sqft ?? 0,
            floorNumber: prop.floorNumber ?? null,
            storeys: prop.storeys ?? null,
            rentScope: prop.rentScope || "",
            washrooms: prop.washrooms ?? null,
            furnishingStatus: prop.furnishingStatus || "",
            yearBuilt: prop.yearBuilt ?? 0,
            amenities: Array.isArray(prop.amenities) ? prop.amenities : prev.property.amenities,
            features: Array.isArray(prop.features) ? prop.features : prev.property.features,
            coverImageUrl: prop.coverImageUrl || "",
            images: Array.isArray(prop.images) ? prop.images : [],
          },
          knowledgeBase: kb
            ? {
                ...prev.knowledgeBase,
                ...kb,
              }
            : prev.knowledgeBase,
          negotiationMatrix: matrix
            ? {
                ...prev.negotiationMatrix,
                ...matrix,
              }
            : prev.negotiationMatrix,
        }));

        if (Array.isArray(prop.images) && prop.images.length > 0) {
          setOnboardingStage("final_review");
        } else if (prop.address && prop.price && Number(prop.price) > 0) {
          setOnboardingStage("photos");
        } else if (prop.address) {
          setOnboardingStage("additional_specs");
        }

        addTelemetryLog(
          "STATE-UPDATE",
          `Draft listing #${initialDraftId} loaded into studio workspace`,
          { title: prop.title, address: prop.address },
          undefined,
          "info"
        );
      } catch (err) {
        console.error("Failed to load initial draft listing:", err);
        addTelemetryLog(
          "STATE-UPDATE",
          `Failed to load draft listing #${initialDraftId}`,
          err,
          undefined,
          "error"
        );
      }
    }

    loadDraftListing();

    return () => {
      isMounted = false;
    };
  }, [initialDraftId, addTelemetryLog]);

  // Latest state for async turn-extraction and voice callbacks; synced after each commit
  const dataRef = useRef(data);
  const onboardingStageRef = useRef(onboardingStage);
  const showFinalModalRef = useRef(showFinalModal);
  useEffect(() => {
    dataRef.current = data;
    onboardingStageRef.current = onboardingStage;
    draftIdRef.current = draftId;
    showFinalModalRef.current = showFinalModal;
  }, [data, onboardingStage, draftId, showFinalModal]);

  const turnSequenceRef = useRef<number>(0);
  const isExtractionBusyRef = useRef<boolean>(false);
  const pendingExtractionWindowRef = useRef<TurnMessage[] | null>(null);
  const failedTurnBufferRef = useRef<TurnMessage[]>([]);
  const pendingModalOpenRef = useRef<boolean>(false);
  const pendingFinalModalOpenRef = useRef<boolean>(false);
  const [isFinalGateLatched, setIsFinalGateLatched] = useState(false);
  const setFinalGate = useCallback((latched: boolean) => {
    pendingFinalModalOpenRef.current = latched;
    setIsFinalGateLatched(latched);
  }, []);
  const isTurnSyncingRef = useRef<boolean>(false);

  // Helper to merge failed/retry turns with incoming turns into a rich sliding window (up to 12 turns)
  const mergeTurnWindows = (prev: TurnMessage[], incoming: TurnMessage[]): TurnMessage[] => {
    const combined = [...prev, ...incoming];
    const deduped: TurnMessage[] = [];
    for (const msg of combined) {
      const last = deduped[deduped.length - 1];
      if (!last || last.role !== msg.role || last.text.trim() !== msg.text.trim()) {
        deduped.push(msg);
      }
    }
    return deduped.slice(-12);
  };

  // Success Modal State
  const [publishedResult, setPublishedResult] = useState<{
    property: any;
    qrCodeSvg: string;
    shareUrl: string;
  } | null>(null);

  const handleUpdateProperty = (updates: Partial<ExtractedPropertyPayload["property"]>) => {
    setData((prev) => ({
      ...prev,
      property: { ...prev.property, ...updates },
      negotiationMatrix: updates.price
        ? {
            ...prev.negotiationMatrix,
            targetPrice: updates.price,
          }
        : prev.negotiationMatrix,
    }));
  };

  // Trigger background hyper-local enrichment with Gemini 3.8 Flash.
  // Owns the whole search, retry included: every attempt after the first is scheduled from
  // inside this loop, so any external call once it has run is a duplicate by definition.
  const triggerLocationEnrichment = useCallback(async (prop: ExtractedPropertyPayload["property"]) => {
    if (!prop.address || isEnrichingLocationRef.current) return;
    if (enrichmentAttemptsRef.current > 0) {
      addTelemetryLog("AI-ENRICH", "Skipped duplicate hyper-local enrichment request (search already ran this session)", {
        address: prop.address,
        attemptsUsed: enrichmentAttemptsRef.current,
      });
      return;
    }

    isEnrichingLocationRef.current = true;
    setIsEnrichingLocation(true);
    setEnrichmentError(null);

    /** Runs one attempt. Returns true when the attempt earned another one. */
    const runAttempt = async (attempt: number): Promise<boolean> => {
      const isFinalAttempt = attempt >= MAX_ENRICHMENT_ATTEMPTS;
      // Transport and server faults are transient until something proves otherwise.
      let shouldRetry = true;

      addTelemetryLog(
        "AI-ENRICH",
        `Hyper-local location enrichment attempt ${attempt}/${MAX_ENRICHMENT_ATTEMPTS} via Gemini 3.8 Flash`,
        { address: prop.address, city: prop.city }
      );

      try {
        const res = await fetch(`${BASE_PATH}/api/onboarding/enrich-location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: prop.address,
            city: prop.city,
            state: prop.state,
            price: prop.price,
            listingType: prop.listingType,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            sqft: prop.sqft,
            propertyType: prop.propertyType,
          }),
        });

        // A route crash returns HTML, not JSON: parsing it first would put a parser error
        // in front of the owner instead of a readable status.
        if (!res.ok) {
          // A rejected address (400) and an expired session (401) fail identically however
          // often we ask; only a server-side fault is worth a second attempt.
          shouldRetry = res.status >= 500;
          throw new Error(`Location research failed (${res.status}).`);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const usable = isUsableHyperLocalResult(json.data.kbData);
          shouldRetry = !usable;

          // An empty attempt 1 is not shown to the owner: the retry is still coming, and a
          // blank card released now would beat the real result to the screen.
          if (usable || isFinalAttempt) {
            setHyperLocalData(json.data.kbData);
            hyperLocalDataRef.current = json.data.kbData;
          }

          // Capture Google Maps usage telemetry if present
          if (json.data.mapsUsage) {
            setSessionUsage((prev) => ({
              ...prev,
              mapsGroundingQueries: prev.mapsGroundingQueries + (json.data.mapsUsage.groundingQueries || 0),
              routesMatrixElements: prev.routesMatrixElements + (json.data.mapsUsage.routeMatrixElements || 0),
              routesApiRequests: prev.routesApiRequests + (json.data.mapsUsage.routeMatrixCalls || 0),
            }));

            addTelemetryLog(
              "MAPS",
              `Google Maps: ${json.data.mapsUsage.groundingQueries} grounding queries (5k pool) • ${json.data.mapsUsage.routeMatrixElements} matrix elements (70k pool)`,
              {
                mapsGrounding: {
                  queriesExecuted: json.data.mapsUsage.groundingQueries,
                  deductedFrom: "Gemini Google Maps Grounding (5,000 free search queries/month)",
                  billingRateAfterFreeTier: "$14.00 per 1,000 search queries",
                },
                routesMatrixApi: {
                  httpCallsMade: json.data.mapsUsage.routeMatrixCalls,
                  elementsCalculated: json.data.mapsUsage.routeMatrixElements,
                  calculation: `${json.data.mapsUsage.routeMatrixCalls > 0 ? json.data.mapsUsage.routeMatrixElements / json.data.mapsUsage.routeMatrixCalls : 0} places × ${json.data.mapsUsage.routeMatrixCalls} modes (WALK + DRIVE)`,
                  deductedFrom: "Google Routes Compute Route Matrix Essentials (70,000 free elements/month in India)",
                  billingRateAfterFreeTier: "Discounted India rate (~₹0.12 - ₹0.15 per element)",
                },
              },
              undefined,
              "success"
            );
          }

          addTelemetryLog(
            "AI-ENRICH",
            usable
              ? `Hyper-local enrichment complete (${json.data.latencyMs}ms)`
              : `Hyper-local enrichment attempt ${attempt} named no places (${json.data.latencyMs}ms)`,
            {
              metro: json.data.kbData.transit?.nearestMetro,
              landmarks: json.data.kbData.neighborhood?.landmarks,
              model: json.data.modelUsed,
              grounded: json.data.grounded,
              distancesMeasured: json.data.distancesMeasured,
              placesMeasured: json.data.kbData.nearbyDistances?.length || 0,
              mapsUsage: json.data.mapsUsage,
            },
            json.data.latencyMs,
            usable ? "success" : "warn"
          );
        } else {
          addTelemetryLog("AI-ENRICH", `Hyper-local enrichment attempt ${attempt} returned no data`, json, undefined, "warn");
          if (shouldRetry && !isFinalAttempt) return true;
          setEnrichmentError(json.error || "Location research returned no result.");
        }
      } catch (err: any) {
        console.warn("[Location Enrichment Error]:", err);
        addTelemetryLog("AI-ENRICH", `Hyper-local enrichment attempt ${attempt} encountered an issue`, err, undefined, "warn");
        // A stale error must never outlive a retry that then succeeds, so it is written
        // only once no further attempt is coming.
        if (shouldRetry && !isFinalAttempt) return true;
        setEnrichmentError(err?.message || "Location research could not complete.");
      }

      return shouldRetry && !isFinalAttempt;
    };

    try {
      while (enrichmentAttemptsRef.current < MAX_ENRICHMENT_ATTEMPTS) {
        const attempt = ++enrichmentAttemptsRef.current;
        setEnrichmentAttempt(attempt);

        if (!(await runAttempt(attempt))) return;

        addTelemetryLog(
          "AI-ENRICH",
          `Attempt ${attempt} produced nothing to confirm - retrying once in ${ENRICHMENT_RETRY_DELAY_MS}ms`,
          null,
          undefined,
          "warn"
        );
        // The HUD stays in its searching state across the backoff so the owner sees one
        // longer search labelled as a retry, not a result flashing red and starting over.
        await new Promise((resolve) => setTimeout(resolve, ENRICHMENT_RETRY_DELAY_MS));
      }
    } finally {
      isEnrichingLocationRef.current = false;
      setIsEnrichingLocation(false);
    }
  }, [addTelemetryLog]);

  // Transition from Stage 1 (Core Specs) to Stage 2 (Additional Specs)
  const handleConfirmCoreSpecs = useCallback(() => {
    setShowCoreModal(false);
    pendingModalOpenRef.current = false;
    setOnboardingStage("additional_specs");
    triggerLocationEnrichment(dataRef.current.property);
  }, [triggerLocationEnrichment]);

  /**
   * Opens the one full review card - main details, extra details and nearby places.
   *
   * The card is never held back for the location search: its nearby-places section shows
   * its own loading state and fills in when the result lands. The gate below is only about
   * spoken specs, which would otherwise read as blank moments after the owner said them.
   */
  const openFullReview = useCallback(() => {
    const hasMoveIn = Boolean(
      dataRef.current.property.availableDate && dataRef.current.property.availableDate.trim().length > 0
    );

    if (isTurnSyncingRef.current || !hasMoveIn) {
      addTelemetryLog(
        "SYNC-GATE",
        "Full Review modal latched (waiting for in-flight turn extraction / move-in timing, max 2500ms)",
        {
          stage: onboardingStageRef.current,
          isTurnSyncing: isTurnSyncingRef.current,
          hasMoveIn,
        },
        undefined,
        "warn"
      );
      setFinalGate(true);

      setTimeout(() => {
        if (pendingFinalModalOpenRef.current) {
          setFinalGate(false);
          setShowFinalModal(true);
          addTelemetryLog("SYNC-GATE", "Released Full Review sync gate via 2500ms fallback timeout", null, undefined, "info");
        }
      }, 2500);
    } else {
      addTelemetryLog("MODAL-TRIGGER", "Opening Full Review Modal immediately", null, undefined, "success");
      setShowFinalModal(true);
      setFinalGate(false);
    }
  }, [addTelemetryLog, setFinalGate]);

  // Create or Update Draft Property in DB for photo uplink
  const createOrUpdateDraft = useCallback(async () => {
    try {
      addTelemetryLog("STATE-UPDATE", "Creating draft property record for photo uplink", {
        draftId: draftIdRef.current,
      });
      const res = await fetch(`${BASE_PATH}/api/properties/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: dataRef.current.property,
          draftId: draftIdRef.current,
          voiceSessionIds: Array.from(voiceSessionIdsRef.current),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDraftId(json.draftId);
        draftIdRef.current = json.draftId;
        setUploadToken(json.uploadToken);
        setUploadUrl(json.uploadUrl);
        setQrCodeSvg(json.qrCodeSvg);
        addTelemetryLog(
          "STATE-UPDATE",
          "Draft property established with QR code",
          { draftId: json.draftId, uploadUrl: json.uploadUrl },
          undefined,
          "success"
        );
        return json;
      }
    } catch (err) {
      console.error("Draft creation error:", err);
      addTelemetryLog("STATE-UPDATE", "Failed to create draft property", err, undefined, "error");
    }
    return null;
  }, [addTelemetryLog]);

  // Transition from the Full Review card (Stage 4) to Photo Intake (Stage 5)
  const handleOpenPhotoUpload = useCallback(async () => {
    setShowFinalModal(false);
    setFinalGate(false);
    setOnboardingStage("photos");
    await createOrUpdateDraft();
    setShowUploadModal(true);
  }, [createOrUpdateDraft, setFinalGate]);

  /**
   * The owner approving the full review card.
   *
   * "Looks good", "that's right" and "continue" are also just how an owner finishes an ordinary
   * answer, and the approval patterns in `src/hooks/voice-intents.ts` match the spoken turn
   * itself - before Elena has announced or opened anything. An approval that lands while no
   * review card is on screen is filler, not consent, and must never advance the flow: acting on
   * one opened the photo uploader mid-intake, which Elena's announcement then closed again a
   * second later. Elena's announcement, the turn extractor and the inspector's Review button
   * all still open the card, so ignoring the stray approval strands nobody.
   */
  const confirmFullReview = useCallback(() => {
    // Read from the last committed render, so a `setShowFinalModal(false)` earlier in the same
    // handler cannot make an open card look closed.
    if (!showFinalModalRef.current) {
      addTelemetryLog(
        "INTENT",
        "Ignored approval because no review card is on screen",
        { stage: onboardingStageRef.current },
        undefined,
        "warn"
      );
      return;
    }
    handleOpenPhotoUpload();
  }, [addTelemetryLog, handleOpenPhotoUpload]);

  // Transition from Photo Intake (Stage 5) to Final Unified Review & Deploy (Stage 6)
  const handleProceedToFinalReview = useCallback(() => {
    setShowUploadModal(false);
    setOnboardingStage("final_review");
    setShowFinalModal(true);
  }, []);

  const handleImagesUpdated = useCallback((newImages: string[]) => {
    setData((prev) => {
      const updated = {
        ...prev,
        property: {
          ...prev.property,
          images: newImages,
          coverImageUrl: prev.property.coverImageUrl || newImages[0] || "",
        },
      };
      dataRef.current = updated;
      return updated;
    });
  }, []);

  const handleUIAction = useCallback(
    (action: UIAction) => {
      addTelemetryLog("INTENT", `UI Action received: ${action}`, {
        stage: onboardingStageRef.current,
        isTurnSyncing: isTurnSyncingRef.current,
      });

      if (action === "end_call") {
        terminateForConduct(true, "Elena delivered the closing line");
        return;
      }

      if (action === "close_call") {
        addTelemetryLog("INTENT", "Elena delivered closing sign-off for deployment", null, undefined, "success");
        if (deployClosingResolveRef.current) {
          deployClosingResolveRef.current();
          deployClosingResolveRef.current = null;
        }
        return;
      }

      if (action === "trigger_deploy") {
        if (!areCoreSpecsVerified(dataRef.current.property, dataRef.current.knowledgeBase)) {
          addTelemetryLog("INTENT", "Ignored trigger_deploy: core specs not verified", null, undefined, "warn");
          return;
        }
        addTelemetryLog("INTENT", "Elena triggered hands-free deploy", null, undefined, "success");
        handlePublishRef.current();
        return;
      }

      if (action === "open_core_modal") {
        if (onboardingStageRef.current === "core") {
          if (!isTurnSyncingRef.current || areCoreSpecsVerified(dataRef.current.property, dataRef.current.knowledgeBase)) {
            addTelemetryLog("MODAL-TRIGGER", "Opening Core Specs Review Card", null, undefined, "success");
            setShowCoreModal(true);
            pendingModalOpenRef.current = false;
          } else {
            addTelemetryLog("SYNC-GATE", "Core Specs modal latched (turn extraction in-flight)", null, undefined, "warn");
            pendingModalOpenRef.current = true;
          }
        } else {
          addTelemetryLog("INTENT", "Ignored open_core_modal because onboarding has advanced past core specs", null, undefined, "info");
        }
      } else if (action === "open_upload_modal") {
        if (onboardingStageRef.current !== "core") {
          addTelemetryLog("MODAL-TRIGGER", "Opening Photo Upload Modal via intent", null, undefined, "success");
          handleOpenPhotoUpload();
        } else {
          addTelemetryLog("INTENT", "Ignored open_upload_modal because stage is still core", null, undefined, "warn");
        }
      } else if (action === "close_upload_modal") {
        addTelemetryLog("MODAL-TRIGGER", "Closing Photo Upload Modal via intent", null);
        setShowUploadModal(false);
      } else if (action === "open_hyper_local") {
        // The neighbourhood layer lives inside the full review card, so an announcement
        // about it opens that card rather than a window of its own.
        if (onboardingStageRef.current === "core") {
          addTelemetryLog("INTENT", "Ignored open_hyper_local because stage is still core", null, undefined, "warn");
          return;
        }
        addTelemetryLog("MODAL-TRIGGER", "Opening Full Review Modal via hyper-local intent", null, undefined, "success");
        setShowUploadModal(false);
        openFullReview();
      } else if (action === "close_hyper_local") {
        addTelemetryLog("MODAL-TRIGGER", "Closing Full Review Modal via hyper-local intent", null);
        confirmFullReview();
      } else if (action === "open_final_modal") {
        if (onboardingStageRef.current === "core") {
          addTelemetryLog("INTENT", "Ignored open_final_modal because stage is still core", null, undefined, "warn");
          return;
        }

        // Close upload modal if it was open and advance to final review stage
        setShowUploadModal(false);
        setOnboardingStage("final_review");
        onboardingStageRef.current = "final_review";
        openFullReview();
      } else if (action === "open_review_modal") {
        if (onboardingStageRef.current === "core") {
          if (!isTurnSyncingRef.current || areCoreSpecsVerified(dataRef.current.property, dataRef.current.knowledgeBase)) {
            addTelemetryLog("MODAL-TRIGGER", "Opening Core Specs Review Card", null, undefined, "success");
            setShowCoreModal(true);
            pendingModalOpenRef.current = false;
          } else {
            addTelemetryLog("SYNC-GATE", "Core Specs modal latched (turn extraction in-flight)", null, undefined, "warn");
            pendingModalOpenRef.current = true;
          }
        } else if (onboardingStageRef.current === "photos") {
          setShowUploadModal(true);
        } else {
          openFullReview();
        }
      } else if (action === "close_review_modal") {
        addTelemetryLog("MODAL-TRIGGER", "Closing Review Modal", null);
        setShowCoreModal(false);
        setShowFinalModal(false);
        setShowUploadModal(false);
        pendingModalOpenRef.current = false;
        setFinalGate(false);
        if (onboardingStageRef.current === "core" && areCoreSpecsVerified(dataRef.current.property, dataRef.current.knowledgeBase)) {
          handleConfirmCoreSpecs();
        } else if (onboardingStageRef.current === "additional_specs") {
          confirmFullReview();
        }
      }
    },
    [handleConfirmCoreSpecs, openFullReview, handleOpenPhotoUpload, confirmFullReview, addTelemetryLog, setFinalGate, terminateForConduct]
  );

  // Trailing Conflating Queue: In-flight Gemini extractions run to completion
  // without being cancelled. Consecutive or fast turns coalesce into a single follow-up call.
  const executeTurnExtraction = async (slidingWindow: TurnMessage[]) => {
    isExtractionBusyRef.current = true;
    setIsTurnSyncing(true);
    isTurnSyncingRef.current = true;
    setPipelineError(null);
    const sequenceId = ++turnSequenceRef.current;
    const startTime = Date.now();

    addTelemetryLog(
      "EXTRACT-REQ",
      `Turn extraction #${sequenceId} (${slidingWindow.length} turns)`,
      {
        turns: slidingWindow.map((t) => `[${t.role}]: ${t.text}`),
        currentVerifiedState: {
          listingType: dataRef.current.property.listingType,
          price: dataRef.current.property.price,
          address: dataRef.current.property.address,
          availableDate: dataRef.current.property.availableDate,
        },
      }
    );

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000);

    try {
      const res = await fetch(`${BASE_PATH}/api/onboarding/extract-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          slidingWindowMessages: slidingWindow,
          currentPropertyState: dataRef.current.property,
          currentKnowledgeBase: dataRef.current.knowledgeBase,
        }),
      });

      clearTimeout(timeoutId);
      const json = await res.json();
      const elapsedMs = Date.now() - startTime;
      let candidateProperty = { ...dataRef.current.property };
      let candidateKb = { ...dataRef.current.knowledgeBase };

      const usage = json.data?.usage || json.usage;
      if (usage) {
        setSessionUsage((prev) => ({
          ...prev,
          promptTokens: prev.promptTokens + (usage.promptTokens || 0),
          candidateTokens: prev.candidateTokens + (usage.candidateTokens || 0),
          totalTokens: prev.totalTokens + (usage.totalTokens || 0),
          totalCostUsd: Number((prev.totalCostUsd + (usage.costUsd || 0)).toFixed(6)),
        }));
      }
      const tokenInfo = usage ? ` - ${usage.totalTokens} tok (${usage.costFormatted})` : "";

      if (json.success && json.data?.updates && Object.keys(json.data.updates).length > 0) {
        // Clear failed retry buffer on successful extraction
        failedTurnBufferRef.current = [];

        const updates = json.data.updates;
        const {
          contactEmail,
          propertyCategory,
          parkingDetail,
          petPolicyDetail,
          utilitiesDetail,
          washroomDetail,
          features: newFeatures,
          amenities: newAmenities,
          pillLabels: newPillLabels,
          hyperLocalAdjustments,
          ...propertyUpdates
        } = updates;

        // Strict Listing Type Lock: once set, cannot be mutated
        if (dataRef.current.property.listingType) {
          propertyUpdates.listingType = dataRef.current.property.listingType;
        }

        if (newPillLabels && Object.keys(newPillLabels).length > 0) {
          setPillLabels((prev) => ({ ...prev, ...newPillLabels }));
        }

        // Voice-First Hyper-Local Adjustments from spoken conversation
        if (hyperLocalAdjustments) {
          const adj = hyperLocalAdjustments;
          setHyperLocalData((prev) => {
            const currentKb = prev || { transit: {}, neighborhood: {}, buyerObjectionsAndPlaybook: [], searchTags: [] };
            const updatedTransit = {
              ...currentKb.transit,
              ...(adj.nearestMetro ? { nearestMetro: adj.nearestMetro } : {}),
            };

            let updatedLandmarks = [...(currentKb.neighborhood?.landmarks || [])];
            if (adj.addLandmarks && adj.addLandmarks.length > 0) {
              updatedLandmarks = Array.from(new Set([...updatedLandmarks, ...adj.addLandmarks]));
            }
            if (adj.removeLandmarks && adj.removeLandmarks.length > 0) {
              updatedLandmarks = updatedLandmarks.filter(
                (l) => !adj.removeLandmarks?.some((r: string) => l.toLowerCase().includes(r.toLowerCase()))
              );
            }

            const updatedNeighborhood = {
              ...currentKb.neighborhood,
              landmarks: updatedLandmarks,
            };

            const nextData: HyperLocalKbData = {
              ...currentKb,
              transit: updatedTransit,
              neighborhood: updatedNeighborhood,
            };
            hyperLocalDataRef.current = nextData;
            return nextData;
          });
        }

        candidateProperty = {
          ...candidateProperty,
          ...propertyUpdates,
          features:
            newFeatures && newFeatures.length > 0
              ? Array.from(new Set([...(candidateProperty.features || []), ...newFeatures]))
              : candidateProperty.features,
          amenities:
            newAmenities && newAmenities.length > 0
              ? Array.from(new Set([...(candidateProperty.amenities || []), ...newAmenities]))
              : candidateProperty.amenities,
        };

        candidateKb = {
          ...dataRef.current.knowledgeBase,
          ...(contactEmail ? { contactEmail } : {}),
          ...(propertyCategory ? { propertyCategory } : {}),
          ...(parkingDetail ? { parkingDetail } : {}),
          ...(petPolicyDetail ? { petPolicyDetail } : {}),
          ...(utilitiesDetail ? { utilitiesDetail } : {}),
          ...(washroomDetail ? { washroomDetail } : {}),
        };

        setData((prev) => {
          const updatedKb = {
            ...prev.knowledgeBase,
            ...(contactEmail ? { contactEmail } : {}),
            ...(propertyCategory ? { propertyCategory } : {}),
          ...(parkingDetail ? { parkingDetail } : {}),
            ...(petPolicyDetail ? { petPolicyDetail } : {}),
            ...(utilitiesDetail ? { utilitiesDetail } : {}),
            ...(washroomDetail ? { washroomDetail } : {}),
          };

          return {
            ...prev,
            property: candidateProperty,
            knowledgeBase: updatedKb,
            negotiationMatrix: propertyUpdates.price
              ? {
                  ...prev.negotiationMatrix,
                  targetPrice: propertyUpdates.price,
                  minFloorPrice: computeFloorPrice(propertyUpdates.price),
                }
              : prev.negotiationMatrix,
          };
        });

        addTelemetryLog(
          "EXTRACT-RES",
          `Turn extraction #${sequenceId} succeeded (${elapsedMs}ms)${tokenInfo}`,
          {
            updatedFields: Object.keys(updates),
            availableDate: updates.availableDate,
            features: updates.features,
            pillLabels: updates.pillLabels,
            modalAction: json.data?.modalAction,
            usage,
          },
          elapsedMs,
          "success"
        );
      } else {
        addTelemetryLog(
          "EXTRACT-RES",
          `Turn extraction #${sequenceId} returned no updates (${elapsedMs}ms)${tokenInfo}`,
          {
            ...json,
            usage,
          },
          elapsedMs,
          "info"
        );
      }

      // Check if every core spec is now verified in state
      const isCoreComplete = areCoreSpecsVerified(candidateProperty, candidateKb);

      // In-Flight Sync Gate: Core Specs
      if (pendingModalOpenRef.current && onboardingStageRef.current === "core") {
        pendingModalOpenRef.current = false;
        setShowCoreModal(true);
      }

      const wasFinalGateReleasedThisTurn = pendingFinalModalOpenRef.current;
      // In-Flight Sync Gate: Final Review Card (guarantees newly spoken details have landed with 0 blanks!)
      if (pendingFinalModalOpenRef.current && (onboardingStageRef.current === "additional_specs" || onboardingStageRef.current === "photos" || onboardingStageRef.current === "final_review")) {
        setFinalGate(false);
        setShowFinalModal(true);
      }

      // Handle modal action intent returned by turn extractor
      // The authoritative strike count. Elena delivers the first two warnings from her own
      // reading of the turn; this decides when the third has arrived, so a caller who talks
      // her out of counting still gets hung up on.
      if (json.success && json.data?.conduct?.offTopic === true) {
        offTopicStrikesRef.current += 1;
        const strikes = offTopicStrikesRef.current;
        addTelemetryLog(
          "INTENT",
          `Off-topic turn ${strikes}/${MAX_OFF_TOPIC_STRIKES}`,
          json.data.conduct.reason || null,
          undefined,
          strikes >= MAX_OFF_TOPIC_STRIKES ? "error" : "warn"
        );
        if (strikes >= MAX_OFF_TOPIC_STRIKES) {
          terminateForConduct(false, `${strikes} off-topic turns`);
        }
      }

      if (json.success && json.data?.modalAction) {
        const action = json.data.modalAction;
        if (action === "open_core") {
          setShowCoreModal(true);
          pendingModalOpenRef.current = false;
        } else if (action === "close_core") {
          if (onboardingStageRef.current === "core") {
            handleConfirmCoreSpecs();
          } else {
            addTelemetryLog("INTENT", "Ignored close_core because onboarding has advanced past core specs", null, undefined, "info");
          }
        } else if (action === "open_hyper_local") {
          openFullReview();
        } else if (action === "close_hyper_local") {
          confirmFullReview();
        } else if (action === "open_final") {
          if (pendingExtractionWindowRef.current || !candidateProperty.availableDate) {
            setFinalGate(true);
          } else {
            setShowFinalModal(true);
            setFinalGate(false);
          }
        } else if (action === "close_final") {
          if (onboardingStageRef.current === "additional_specs") {
            // Leaves a latched open-gate alone: the card the owner has not seen yet is still
            // coming, and cancelling it here would leave them with nothing to approve.
            confirmFullReview();
          } else if (!wasFinalGateReleasedThisTurn && showFinalModalRef.current) {
            setShowFinalModal(false);
            setFinalGate(false);
          } else {
            addTelemetryLog(
              "INTENT",
              "Ignored close_final because final review modal was just opened or is not actively visible",
              null,
              undefined,
              "info"
            );
          }
        } else if (action === "open") {
          if (onboardingStageRef.current === "core") {
            if (isCoreComplete) {
              setShowCoreModal(true);
            } else {
              pendingModalOpenRef.current = true;
            }
          } else if (onboardingStageRef.current === "additional_specs") {
            openFullReview();
          } else {
            if (pendingExtractionWindowRef.current || !candidateProperty.availableDate) {
              setFinalGate(true);
            } else {
              setShowFinalModal(true);
              setFinalGate(false);
            }
          }
        } else if (action === "close") {
          if (onboardingStageRef.current === "core") {
            handleConfirmCoreSpecs();
          } else if (onboardingStageRef.current === "additional_specs") {
            confirmFullReview();
          } else {
            setShowFinalModal(false);
            setFinalGate(false);
          }
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startTime;
      const isAborted = err.name === "AbortError";

      // Coalesce failed window into retry buffer so no turns or facts are missed
      failedTurnBufferRef.current = mergeTurnWindows(failedTurnBufferRef.current, slidingWindow);

      addTelemetryLog(
        isAborted ? "SYNC-GATE" : "ERROR",
        `Turn extraction #${sequenceId} ${isAborted ? "timed out (15s limit) - buffered for retry" : "failed - buffered for retry"} (${elapsedMs}ms)`,
        err.message || String(err),
        elapsedMs,
        isAborted ? "warn" : "error"
      );

      // Never invoke console.error on AbortError to prevent Next.js Turbopack dev error overlay
      if (!isAborted) {
        console.error("[Turn Extraction Client Error]:", err);
        setPipelineError(err.message || "Turn extraction encountered an issue.");
      }
    } finally {
      // If new turns arrived while this extraction was in flight, execute the latest coalesced snapshot
      const pendingSnapshot = pendingExtractionWindowRef.current;
      pendingExtractionWindowRef.current = null;

      if (pendingSnapshot && pendingSnapshot.length > 0) {
        const nextWindow = failedTurnBufferRef.current.length > 0
          ? mergeTurnWindows(failedTurnBufferRef.current, pendingSnapshot)
          : pendingSnapshot;
        executeTurnExtraction(nextWindow);
      } else {
        isExtractionBusyRef.current = false;
        if (sequenceId === turnSequenceRef.current) {
          setIsTurnSyncing(false);
          isTurnSyncingRef.current = false;
        }
      }
    }
  };

  const handleTurnExtraction = (slidingWindow: TurnMessage[]) => {
    if (!slidingWindow || slidingWindow.length === 0) return;

    if (isDeployClosingRef.current) {
      setTimeout(() => {
        if (deployClosingResolveRef.current) {
          deployClosingResolveRef.current();
          deployClosingResolveRef.current = null;
        }
      }, 1500);
      return;
    }

    const windowToRun = failedTurnBufferRef.current.length > 0
      ? mergeTurnWindows(failedTurnBufferRef.current, slidingWindow)
      : slidingWindow;

    if (isExtractionBusyRef.current) {
      // Coalesce into pending snapshot: latest conversational state always wins
      pendingExtractionWindowRef.current = windowToRun;
      return;
    }

    executeTurnExtraction(windowToRun);
  };

  const handleUpdateKnowledgeBase = (
    updates: Partial<ExtractedPropertyPayload["knowledgeBase"]>
  ) => {
    setData((prev) => ({
      ...prev,
      knowledgeBase: { ...prev.knowledgeBase, ...updates },
    }));
  };

  // Publish Handler
  const handlePublish = useCallback(async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    isDeployClosingRef.current = true;
    try {
      addTelemetryLog(
        "INTENT",
        "Deploy initiated: Publishing property listing to database",
        null,
        undefined,
        "info"
      );

      const res = await fetch(`${BASE_PATH}/api/properties/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: data.property,
          knowledgeBase: {
            ...data.knowledgeBase,
            city: data.property.city,
            state: data.property.state,
            listingType: data.property.listingType,
            price: data.property.price,
            kbData: hyperLocalDataRef.current || data.knowledgeBase.kbData,
          },
          negotiationMatrix: data.negotiationMatrix,
          draftId: draftIdRef.current,
          voiceSessionIds: Array.from(voiceSessionIdsRef.current),
        }),
      });

      const json = await res.json();

      if (json.success) {
        addTelemetryLog(
          "INTENT",
          "Deploy confirmed: Listing created successfully, alerting Elena Vance",
          { propertyId: json.property?.id },
          undefined,
          "success"
        );

        if (voiceControlRef.current?.isCallActive && voiceControlRef.current?.sendTextMessage) {
          try {
            await voiceControlRef.current.sendTextMessage(
              "[DEPLOY_CONFIRMED] The listing was successfully published and saved to the database. Deliver your warm, celebratory closing remarks and sign off with [UI:CLOSE_CALL] now."
            );

            await new Promise<void>((resolve) => {
              deployClosingResolveRef.current = resolve;
              setTimeout(() => {
                if (deployClosingResolveRef.current === resolve) {
                  deployClosingResolveRef.current = null;
                  resolve();
                }
              }, 10000);
            });
          } catch (msgErr) {
            console.warn("Deploy confirmation message warning:", msgErr);
          }

          try {
            await voiceControlRef.current.endCall();
          } catch (endErr) {
            console.warn("Call disconnect error on deploy:", endErr);
          }
        }

        setShowFinalModal(false);
        setShowUploadModal(false);
        setPublishedResult({
          property: json.property,
          qrCodeSvg: json.qrCodeSvg,
          shareUrl: json.shareUrl,
        });
      } else {
        const errMsg = json.error || "Failed to publish listing.";
        addTelemetryLog("INTENT", `Deploy failed: ${errMsg}`, null, undefined, "error");

        if (voiceControlRef.current?.isCallActive && voiceControlRef.current?.sendTextMessage) {
          try {
            await voiceControlRef.current.sendTextMessage(
              `[DEPLOY_FAILED] Failed to publish listing: ${errMsg}. Please inform the owner and let them know they can retry or check their details.`
            );
          } catch (errAlert) {
            console.warn("Deploy failure alert warning:", errAlert);
          }
        }

        alert(errMsg);
      }
    } catch (err) {
      console.error("Publishing error:", err);
      const errMsg = "An unexpected error occurred while publishing.";
      addTelemetryLog("INTENT", `Deploy exception: ${err}`, null, undefined, "error");

      if (voiceControlRef.current?.isCallActive && voiceControlRef.current?.sendTextMessage) {
        try {
          await voiceControlRef.current.sendTextMessage(
            `[DEPLOY_FAILED] An unexpected error occurred while publishing. Please inform the owner and invite them to retry.`
          );
        } catch (errAlert) {
          console.warn("Deploy exception alert warning:", errAlert);
        }
      }

      alert(errMsg);
    } finally {
      setIsPublishing(false);
      isDeployClosingRef.current = false;
      deployClosingResolveRef.current = null;
    }
  }, [isPublishing, data, addTelemetryLog]);

  useEffect(() => {
    handlePublishRef.current = handlePublish;
  }, [handlePublish]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-bold text-blue-700">Studio Onboarding</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Property Onboarding Studio</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Voice & AI
            </span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Converse naturally with Elena Vance to dynamically extract property specs and deploy a 24/7 Voice Sales Agent.
          </p>
        </div>

        {/* Right Header Action: Telemetry HUD Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={toggleHud}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              isHudOpen
                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            }`}
            title="Toggle Live Telemetry & Pipeline Inspector"
          >
            <Activity className={`w-3.5 h-3.5 ${isHudOpen ? "text-white" : "text-indigo-600"}`} />
            <span>Telemetry HUD</span>
            {telemetryLogs.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isHudOpen
                    ? "bg-white/20 text-white"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                }`}
              >
                {telemetryLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dimmed studio behind the intro card; lifts as the split layout takes over. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm ${
          entryStage === "split" ? "pointer-events-none" : ""
        }`}
      />

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Conversational Ingestion Panel. Never unmounts - it holds the RTC client. */}
        <div {...{ [FLIP_ATTR]: "panel" }} className={PANEL_STAGE_CLASSES[entryStage]}>
          <ConversationalPanel
            entryStage={entryStage}
            conductNotice={conductNotice}
            onMicGranted={() => {
              // Every call starts clean: strikes and the hang-up latch are per call.
              offTopicStrikesRef.current = 0;
              conductTerminatedRef.current = false;
              setConductNotice(null);
              // Only the opening Start grows the card. Disconnecting mid-interview brings
              // the idle card back inside the split layout, and reconnecting from there
              // must not fly the panel back to the centre of the screen.
              if (entryStageRef.current === "intro") advanceEntryStage("focused");
            }}
            ownerName={user?.name || ""}
            ownerEmail={user?.email || ""}
            onTurnExtraction={handleTurnExtraction}
            onUIAction={handleUIAction}
            onLogEvent={addTelemetryLog}
            onVoiceStateSync={handleVoiceStateSync}
            isProcessing={isTurnSyncing}
            activePipelineStep={isTurnSyncing ? "Extracting live specifications..." : null}
            pipelineError={pipelineError}
            draftId={draftId}
          />
        </div>

        {/* Right Column: Live Property Inspector. Absent until the first extraction lands,
            so the pane never appears pre-filled with fields nobody has spoken to yet. */}
        {entryStage === "split" && (
        <div {...{ [FLIP_ATTR]: "inspector" }} className={INSPECTOR_STAGE_CLASSES}>
          <LivePropertyInspector
            data={data}
            ownerName={user?.name || ""}
            onboardingStage={onboardingStage}
            pillLabels={pillLabels}
            onUpdateProperty={handleUpdateProperty}
            onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
            onPublish={handlePublish}
            onOpenCoreModal={() => setShowCoreModal(true)}
            onOpenReviewModal={() => {
              if (onboardingStage === "core") {
                setShowCoreModal(true);
              } else if (onboardingStage === "photos") {
                setShowUploadModal(true);
              } else {
                setShowFinalModal(true);
              }
            }}
            isPublishing={isPublishing}
            isExtracting={isTurnSyncing}
            isTurnSyncing={isTurnSyncing}
            isEnrichingLocation={isEnrichingLocation}
            hyperLocalData={hyperLocalData}
            enrichmentError={enrichmentError}
            enrichmentAttempt={enrichmentAttempt}
            maxEnrichmentAttempts={MAX_ENRICHMENT_ATTEMPTS}
          />
        </div>
        )}
      </div>

      {/* 1. Core Specs Review Modal (Stage 2: all core specs verified) */}
      {showCoreModal && (
        <ReviewSpecsModal
          mode="core"
          onClose={() => setShowCoreModal(false)}
          property={data.property}
          knowledgeBase={data.knowledgeBase}
          contactEmail={data.knowledgeBase.contactEmail || user?.email || ""}
          ownerName={user?.name || ""}
          onConfirmCore={handleConfirmCoreSpecs}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          isCallActive={voiceControl?.isCallActive ?? false}
          isMuted={voiceControl?.isMuted ?? false}
          onToggleMute={voiceControl?.toggleMute}
        />
      )}

      {/* 2. Full Review Modal (Stage 4): main details, extra details and nearby places */}
      {showFinalModal && onboardingStage === "additional_specs" && (
        <ReviewSpecsModal
          mode="additional"
          onClose={() => setShowFinalModal(false)}
          property={data.property}
          knowledgeBase={data.knowledgeBase}
          contactEmail={data.knowledgeBase.contactEmail || user?.email || ""}
          ownerName={user?.name || ""}
          onProceedToUpload={handleOpenPhotoUpload}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          isCallActive={voiceControl?.isCallActive ?? false}
          isMuted={voiceControl?.isMuted ?? false}
          onToggleMute={voiceControl?.toggleMute}
          hyperLocalData={hyperLocalData}
          isEnrichingLocation={isEnrichingLocation}
          enrichmentError={enrichmentError}
        />
      )}

      {/* 3. Property Photo Uplink Modal (Stage 5) */}
      <ImageUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        draftId={draftId}
        uploadToken={uploadToken}
        uploadUrl={uploadUrl}
        qrCodeSvg={qrCodeSvg}
        propertyTitle={data.property.title || data.property.address}
        existingImages={data.property.images || []}
        onImagesUpdated={handleImagesUpdated}
        onProceedToFinalReview={handleProceedToFinalReview}
        isCallActive={voiceControl?.isCallActive ?? false}
        isMuted={voiceControl?.isMuted ?? false}
        onToggleMute={voiceControl?.toggleMute}
      />

      {/* 4. Final Unified Review Modal (Stage 6: Final Review & Deploy) */}
      {showFinalModal && (onboardingStage === "final_review" || onboardingStage === "photos") && (
        <ReviewSpecsModal
          mode="final"
          onClose={() => setShowFinalModal(false)}
          property={data.property}
          knowledgeBase={data.knowledgeBase}
          contactEmail={data.knowledgeBase.contactEmail || user?.email || ""}
          ownerName={user?.name || ""}
          onProceedToUpload={() => {
            setShowFinalModal(false);
            setShowUploadModal(true);
          }}
          onPublish={handlePublish}
          isPublishing={isPublishing}
          isCallActive={voiceControl?.isCallActive ?? false}
          isMuted={voiceControl?.isMuted ?? false}
          onToggleMute={voiceControl?.toggleMute}
          hyperLocalData={hyperLocalData}
          isEnrichingLocation={isEnrichingLocation}
          enrichmentError={enrichmentError}
        />
      )}

      {/* Success Launchpad Modal */}
      {publishedResult && (
        <PublishSuccessModal
          onClose={() => setPublishedResult(null)}
          property={publishedResult.property}
          qrCodeSvg={publishedResult.qrCodeSvg}
          shareUrl={publishedResult.shareUrl}
          isCallActive={voiceControl?.isCallActive ?? false}
          isMuted={voiceControl?.isMuted ?? false}
          onToggleMute={voiceControl?.toggleMute}
        />
      )}

      {/* Real-time Telemetry & Pipeline Inspector HUD */}
      <TelemetryHUD
        isOpen={isHudOpen}
        onClose={() => setHudStore(false)}
        logs={telemetryLogs}
        onClearLogs={() => {
          setTelemetryLogs([]);
          setSessionUsage({
            promptTokens: 0,
            candidateTokens: 0,
            totalTokens: 0,
            totalCostUsd: 0,
            agoraDurationSeconds: 0,
            mapsGroundingQueries: 0,
            routesMatrixElements: 0,
            routesApiRequests: 0,
          });
        }}
        syncStatus={{
          isTurnSyncing,
          pendingFinalModalOpen: isFinalGateLatched,
          onboardingStage,
          availableDate: data.property.availableDate,
          isCallConnected: Boolean(voiceControl?.isCallActive),
          sessionUsage,
        }}
      />
    </div>
  );
}
