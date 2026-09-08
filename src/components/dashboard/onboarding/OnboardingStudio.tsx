"use client";

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from "react";
import { ConversationalPanel, type VoiceControlState } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ReviewSpecsModal } from "./ReviewSpecsModal";
import { ImageUploadModal } from "./ImageUploadModal";
import { HyperLocalModal } from "./HyperLocalModal";
import type { HyperLocalKbData } from "@/db/schema";
import { TelemetryHUD, type TelemetryLogEvent } from "./TelemetryHUD";
import { areCoreSpecsVerified, getCoreSpecStatus } from "./inspector-specs";
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
    propertyType: "apartment",
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [isTurnSyncing, setIsTurnSyncing] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<"core" | "additional_specs" | "hyper_local" | "photos" | "final_review">("core");
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHyperLocalModal, setShowHyperLocalModal] = useState(false);
  const [hyperLocalData, setHyperLocalData] = useState<HyperLocalKbData | null>(null);
  const hyperLocalDataRef = useRef<HyperLocalKbData | null>(null);
  const [, setEaScript] = useState<string | null>(null);
  const eaScriptRef = useRef<string | null>(null);
  const [isEnrichingLocation, setIsEnrichingLocation] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const isEnrichingLocationRef = useRef(false);
  const hasRequestedEnrichmentRef = useRef(false);
  const pendingHyperLocalModalOpenRef = useRef(false);
  const [draftId, setDraftId] = useState<number | null>(initialDraftId || null);
  const [uploadToken, setUploadToken] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [qrCodeSvg, setQrCodeSvg] = useState("");
  const draftIdRef = useRef<number | null>(initialDraftId || null);
  const [voiceControl, setVoiceControl] = useState<VoiceControlState | null>(null);

  const handleVoiceStateSync = useCallback((state: VoiceControlState) => {
    setVoiceControl(state);
  }, []);

  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEvent[]>([]);
  const [sessionUsage, setSessionUsage] = useState({
    promptTokens: 0,
    candidateTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
  });
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
  useEffect(() => {
    dataRef.current = data;
    onboardingStageRef.current = onboardingStage;
    draftIdRef.current = draftId;
  }, [data, onboardingStage, draftId]);

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

  // Trigger background hyper-local enrichment with Gemini 3.8 Flash
  const triggerLocationEnrichment = useCallback(async (prop: ExtractedPropertyPayload["property"]) => {
    if (!prop.address || isEnrichingLocationRef.current) return;
    // The search is a single real-world Maps fetch tied to core-spec confirmation. Several
    // conversational paths can land on this call again later in the session; each one after
    // the first is a duplicate, not a retry.
    if (hasRequestedEnrichmentRef.current) {
      addTelemetryLog("AI-ENRICH", "Skipped duplicate hyper-local enrichment request (already ran this session)", {
        address: prop.address,
      });
      return;
    }
    hasRequestedEnrichmentRef.current = true;
    isEnrichingLocationRef.current = true;
    setIsEnrichingLocation(true);
    setEnrichmentError(null);
    addTelemetryLog("AI-ENRICH", "Triggered background hyper-local location enrichment via Gemini 3.8 Flash", {
      address: prop.address,
      city: prop.city,
    });

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
      if (!res.ok) throw new Error(`Location research failed (${res.status}).`);

      const json = await res.json();
      if (json.success && json.data) {
        setHyperLocalData(json.data.kbData);
        hyperLocalDataRef.current = json.data.kbData;
        setEaScript(json.data.eaScript);
        eaScriptRef.current = json.data.eaScript;

        addTelemetryLog(
          "AI-ENRICH",
          `Hyper-local enrichment complete (${json.data.latencyMs}ms)`,
          {
            metro: json.data.kbData.transit?.nearestMetro,
            landmarks: json.data.kbData.neighborhood?.landmarks,
            model: json.data.modelUsed,
          },
          json.data.latencyMs,
          "success"
        );

        // In-Flight Sync Gate: If Elena or owner announced hyper-local card while in-flight, release gate and open modal now!
        if (pendingHyperLocalModalOpenRef.current) {
          pendingHyperLocalModalOpenRef.current = false;
          setShowHyperLocalModal(true);
        }
      } else {
        setEnrichmentError(json.error || "Location research returned no result.");
        addTelemetryLog("AI-ENRICH", "Hyper-local enrichment returned no data", json, undefined, "warn");
      }
    } catch (err: any) {
      console.warn("[Location Enrichment Error]:", err);
      setEnrichmentError(err?.message || "Location research could not complete.");
      addTelemetryLog("AI-ENRICH", "Hyper-local enrichment encountered an issue", err, undefined, "warn");
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

  // Transition to Hyper-Local Intelligence (Stage 4.5)
  const handleOpenHyperLocal = useCallback(() => {
    setShowFinalModal(false);
    setOnboardingStage("hyper_local");

    if (hyperLocalDataRef.current) {
      setShowHyperLocalModal(true);
      pendingHyperLocalModalOpenRef.current = false;
    } else if (isEnrichingLocationRef.current) {
      addTelemetryLog("SYNC-GATE", "Hyper-Local modal latched (waiting for Gemini 3.8 Flash enrichment)", null, undefined, "warn");
      pendingHyperLocalModalOpenRef.current = true;
      setTimeout(() => {
        if (pendingHyperLocalModalOpenRef.current) {
          pendingHyperLocalModalOpenRef.current = false;
          setShowHyperLocalModal(true);
          addTelemetryLog("SYNC-GATE", "Released Hyper-Local sync gate via fallback timeout", null, undefined, "info");
        }
      }, 3000);
    } else {
      triggerLocationEnrichment(dataRef.current.property);
      setShowHyperLocalModal(true);
    }
  }, [addTelemetryLog, triggerLocationEnrichment]);

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

  // Transition from Hyper-Local Intelligence (Stage 4.5) to Photo Intake (Stage 5)
  const handleConfirmHyperLocal = useCallback(async () => {
    setShowHyperLocalModal(false);
    pendingHyperLocalModalOpenRef.current = false;
    setOnboardingStage("photos");
    await createOrUpdateDraft();
    setShowUploadModal(true);
  }, [createOrUpdateDraft]);

  // Transition from Additional Specs (Stage 4) to Photo Intake (Stage 5) or Hyper-Local
  const handleOpenPhotoUpload = useCallback(async () => {
    setShowFinalModal(false);
    handleOpenHyperLocal();
  }, [handleOpenHyperLocal]);

  // Transition from Photo Intake (Stage 5) to Final Unified Review & Deploy (Stage 6)
  const handleProceedToFinalReview = useCallback(() => {
    setShowUploadModal(false);
    setOnboardingStage("final_review");
    setShowFinalModal(true);
  }, []);

  const handleUIAction = useCallback(
    (action: UIAction) => {
      addTelemetryLog("INTENT", `UI Action received: ${action}`, {
        stage: onboardingStageRef.current,
        isTurnSyncing: isTurnSyncingRef.current,
      });

      if (action === "open_core_modal") {
        if (onboardingStageRef.current === "core") {
          if (areCoreSpecsVerified(dataRef.current.property)) {
            addTelemetryLog("MODAL-TRIGGER", "Opening Core Specs Review Card (Verified 6/6)", null, undefined, "success");
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
        addTelemetryLog("MODAL-TRIGGER", "Opening Hyper-Local Modal via intent", null, undefined, "success");
        handleOpenHyperLocal();
      } else if (action === "close_hyper_local") {
        addTelemetryLog("MODAL-TRIGGER", "Closing Hyper-Local Modal via intent", null);
        handleConfirmHyperLocal();
      } else if (action === "open_final_modal") {
        if (onboardingStageRef.current === "core") {
          addTelemetryLog("INTENT", "Ignored open_final_modal because stage is still core", null, undefined, "warn");
          return;
        }

        // Close upload modal if it was open
        setShowUploadModal(false);

        const hasMoveIn = Boolean(dataRef.current.property.availableDate && dataRef.current.property.availableDate.trim().length > 0);

        if (isTurnSyncingRef.current || !hasMoveIn) {
          addTelemetryLog(
            "SYNC-GATE",
            "Final Review modal latched (waiting for in-flight turn extraction / move-in timing, max 2500ms)",
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
              addTelemetryLog("SYNC-GATE", "Released Final Review sync gate via 2500ms fallback timeout", null, undefined, "info");
            }
          }, 2500);
        } else {
          addTelemetryLog("MODAL-TRIGGER", "Opening Final Review Modal immediately", null, undefined, "success");
          setShowFinalModal(true);
          setFinalGate(false);
        }
      } else if (action === "open_review_modal") {
        if (onboardingStageRef.current === "core") {
          if (areCoreSpecsVerified(dataRef.current.property)) {
            addTelemetryLog("MODAL-TRIGGER", "Opening Core Specs Review Card (Verified 6/6)", null, undefined, "success");
            setShowCoreModal(true);
            pendingModalOpenRef.current = false;
          } else {
            addTelemetryLog("SYNC-GATE", "Core Specs modal latched (turn extraction in-flight)", null, undefined, "warn");
            pendingModalOpenRef.current = true;
          }
        } else if (onboardingStageRef.current === "additional_specs") {
          handleOpenHyperLocal();
        } else if (onboardingStageRef.current === "photos") {
          setShowUploadModal(true);
        } else {
          const hasMoveIn = Boolean(dataRef.current.property.availableDate && dataRef.current.property.availableDate.trim().length > 0);
          if (isTurnSyncingRef.current || !hasMoveIn) {
            addTelemetryLog(
              "SYNC-GATE",
              "Final Review modal latched (waiting for in-flight turn extraction, max 2500ms)",
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
                addTelemetryLog("SYNC-GATE", "Released Final Review sync gate via 2500ms fallback timeout", null, undefined, "info");
              }
            }, 2500);
          } else {
            addTelemetryLog("MODAL-TRIGGER", "Opening Final Review Modal immediately", null, undefined, "success");
            setShowFinalModal(true);
            setFinalGate(false);
          }
        }
      } else if (action === "close_review_modal") {
        addTelemetryLog("MODAL-TRIGGER", "Closing Review Modal", null);
        setShowCoreModal(false);
        setShowFinalModal(false);
        setShowUploadModal(false);
        setShowHyperLocalModal(false);
        pendingModalOpenRef.current = false;
        pendingHyperLocalModalOpenRef.current = false;
        setFinalGate(false);
        if (onboardingStageRef.current === "core" && areCoreSpecsVerified(dataRef.current.property)) {
          handleConfirmCoreSpecs();
        } else if (onboardingStageRef.current === "additional_specs") {
          handleOpenHyperLocal();
        } else if (onboardingStageRef.current === "hyper_local") {
          handleConfirmHyperLocal();
        }
      }
    },
    [handleConfirmCoreSpecs, handleOpenHyperLocal, handleConfirmHyperLocal, addTelemetryLog, setFinalGate]
  );

  // Trailing Conflating Queue: In-flight Gemini extractions run to completion
  // without being cancelled. Consecutive or fast turns coalesce into a single follow-up call.
  const executeTurnExtraction = async (slidingWindow: TurnMessage[]) => {
    isExtractionBusyRef.current = true;
    setIsTurnSyncing(true);
    isTurnSyncingRef.current = true;
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
          currentHyperLocalData: hyperLocalDataRef.current,
        }),
      });

      clearTimeout(timeoutId);
      const json = await res.json();
      const elapsedMs = Date.now() - startTime;
      let candidateProperty = { ...dataRef.current.property };

      const usage = json.data?.usage || json.usage;
      if (usage) {
        setSessionUsage((prev) => ({
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
          parkingDetail,
          petPolicyDetail,
          utilitiesDetail,
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

        setData((prev) => {
          const updatedKb = {
            ...prev.knowledgeBase,
            ...(contactEmail ? { contactEmail } : {}),
            ...(parkingDetail ? { parkingDetail } : {}),
            ...(petPolicyDetail ? { petPolicyDetail } : {}),
            ...(utilitiesDetail ? { utilitiesDetail } : {}),
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

      // Check if all 6 core specs are now verified in state
      const isCoreComplete = areCoreSpecsVerified(candidateProperty);

      // In-Flight Sync Gate: Core Specs
      if (isCoreComplete && pendingModalOpenRef.current && onboardingStageRef.current === "core") {
        pendingModalOpenRef.current = false;
        setShowCoreModal(true);
      }

      // In-Flight Sync Gate: Final Review Card (guarantees newly spoken details have landed with 0 blanks!)
      if (pendingFinalModalOpenRef.current && (onboardingStageRef.current === "additional_specs" || onboardingStageRef.current === "photos" || onboardingStageRef.current === "final_review")) {
        setFinalGate(false);
        setShowFinalModal(true);
      }

      // Handle modal action intent returned by turn extractor
      if (json.success && json.data?.modalAction) {
        const action = json.data.modalAction;
        if (action === "open_core") {
          // Strictly guard: Only open if all 6 core specs are truly verified
          if (isCoreComplete) {
            setShowCoreModal(true);
          } else {
            // Latch pending modal open until specs land
            pendingModalOpenRef.current = true;
          }
        } else if (action === "close_core") {
          if (onboardingStageRef.current === "core") {
            handleConfirmCoreSpecs();
          } else {
            addTelemetryLog("INTENT", "Ignored close_core because onboarding has advanced past core specs", null, undefined, "info");
          }
        } else if (action === "open_hyper_local") {
          handleOpenHyperLocal();
        } else if (action === "close_hyper_local") {
          handleConfirmHyperLocal();
        } else if (action === "open_final") {
          if (pendingExtractionWindowRef.current || !candidateProperty.availableDate) {
            setFinalGate(true);
          } else {
            setShowFinalModal(true);
            setFinalGate(false);
          }
        } else if (action === "close_final") {
          setShowFinalModal(false);
          setFinalGate(false);
          if (onboardingStageRef.current === "additional_specs") {
            handleOpenHyperLocal();
          } else if (onboardingStageRef.current === "hyper_local") {
            handleConfirmHyperLocal();
          }
        } else if (action === "open") {
          if (onboardingStageRef.current === "core") {
            if (isCoreComplete) {
              setShowCoreModal(true);
            } else {
              pendingModalOpenRef.current = true;
            }
          } else if (onboardingStageRef.current === "additional_specs") {
            handleOpenHyperLocal();
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
            handleOpenHyperLocal();
          } else if (onboardingStageRef.current === "hyper_local") {
            handleConfirmHyperLocal();
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

  // URL Ingestion Handler
  const handleIngestUrl = async (url: string) => {
    setIsProcessing(true);
    setPipelineError(null);
    setActivePipelineStep("Crawling listing webpage via Apify Actor...");

    try {
      // Step 1: Scrape URL
      const scrapeRes = await fetch(`${BASE_PATH}/api/onboarding/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const scrapeJson = await scrapeRes.json();
      if (!scrapeJson.success) {
        throw new Error(scrapeJson.error || "The listing crawl failed.");
      }
      const scrapedData = scrapeJson.data;

      // Step 2: Extract structured intelligence with Gemini
      setActivePipelineStep("Synthesizing property specs, FAQs, and voice sales pitch with AI...");
      const extractRes = await fetch(`${BASE_PATH}/api/onboarding/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          markdown: scrapedData?.markdown || "",
          existingImages: scrapedData?.images || [],
          currentPropertyState: data,
        }),
      });

      const extractJson = await extractRes.json();
      if (!extractJson.success || !extractJson.data) {
        throw new Error(extractJson.error || "Knowledge-base synthesis failed.");
      }
      setData(extractJson.data);
    } catch (err) {
      console.error("URL Ingestion error:", err);
      setPipelineError(err instanceof Error ? err.message : "The listing import failed.");
    } finally {
      setIsProcessing(false);
      setActivePipelineStep(null);
    }
  };

  // Conversational Extraction Handler (invoked at call completion with owner dialogue)
  const handleSendMessage = async (text: string) => {
    if (!text || !text.trim()) return;

    const startTime = Date.now();
    addTelemetryLog("DISCONNECT-SYNTHESIS", "Initiated end-of-call full transcript synthesis", {
      transcriptLength: text.length,
    });

    setIsProcessing(true);
    setPipelineError(null);
    setActivePipelineStep("Synthesizing voice intelligence & knowledge base...");

    try {
      const res = await fetch(`${BASE_PATH}/api/onboarding/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationText: text,
          markdown: dataRef.current.knowledgeBase.rawScrapedMarkdown || "",
          existingImages: dataRef.current.property.images,
          currentPropertyState: dataRef.current,
        }),
      });

      const json = await res.json();
      const elapsedMs = Date.now() - startTime;

      if (!json.success || !json.data) {
        throw new Error(json.error || "Knowledge-base synthesis failed.");
      }

      const synthUsage = json.data?.usage || json.usage;
      if (synthUsage) {
        setSessionUsage((prev) => ({
          promptTokens: prev.promptTokens + (synthUsage.promptTokens || 0),
          candidateTokens: prev.candidateTokens + (synthUsage.candidateTokens || 0),
          totalTokens: prev.totalTokens + (synthUsage.totalTokens || 0),
          totalCostUsd: Number((prev.totalCostUsd + (synthUsage.costUsd || 0)).toFixed(6)),
        }));
      }
      const tokenInfo = synthUsage ? ` - ${synthUsage.totalTokens} tok (${synthUsage.costFormatted})` : "";

      addTelemetryLog(
        "DISCONNECT-SYNTHESIS",
        `Full transcript synthesis completed (${elapsedMs}ms)${tokenInfo}`,
        {
          availableDate: json.data.property?.availableDate,
          features: json.data.property?.features,
          pillLabels: json.data.knowledgeBase?.pillLabels,
          detectedDiscrepancies: json.data.detectedDiscrepancies,
          usage: synthUsage,
        },
        elapsedMs,
        "success"
      );

      if (json.data.knowledgeBase?.pillLabels && Object.keys(json.data.knowledgeBase.pillLabels).length > 0) {
        setPillLabels((pl) => ({ ...pl, ...json.data.knowledgeBase.pillLabels }));
      }

      setData((prev) => {
        const newProp = json.data.property || {};
        const newKb = json.data.knowledgeBase || {};
        const newMatrix = json.data.negotiationMatrix || {};
        const verified = getCoreSpecStatus(prev.property);

        return {
          property: {
            ...prev.property,
            title: newProp.title || prev.property.title,
            slug: newProp.slug || prev.property.slug,
            description: newProp.description || prev.property.description,
            // Protect live-verified specs: do not let end-of-call synthesis clobber them
            listingType: verified.listingType ? prev.property.listingType : newProp.listingType,
            propertyType: prev.property.propertyType || newProp.propertyType,
            price: verified.price ? prev.property.price : (newProp.price || 0),
            securityDeposit: newProp.securityDeposit || prev.property.securityDeposit,
            minLeaseMonths: newProp.minLeaseMonths || prev.property.minLeaseMonths,
            hoaFeeMonthly: newProp.hoaFeeMonthly || prev.property.hoaFeeMonthly,
            address: verified.address ? prev.property.address : (newProp.address || ""),
            unitNumber: newProp.unitNumber || prev.property.unitNumber,
            city: prev.property.city?.trim() ? prev.property.city : (newProp.city || ""),
            state: prev.property.state?.trim() ? prev.property.state : (newProp.state || ""),
            zipCode: prev.property.zipCode?.trim() ? prev.property.zipCode : (newProp.zipCode || ""),
            country: "India",
            bedrooms: verified.bedrooms ? prev.property.bedrooms : (newProp.bedrooms || 0),
            bathrooms: verified.bathrooms ? prev.property.bathrooms : (newProp.bathrooms || 0),
            sqft: verified.sqft ? prev.property.sqft : (newProp.sqft || 0),
            yearBuilt: newProp.yearBuilt || prev.property.yearBuilt,
            availableDate: newProp.availableDate || prev.property.availableDate,
            amenities: (newProp.amenities && newProp.amenities.length > 0) ? newProp.amenities : prev.property.amenities,
            features: (newProp.features && newProp.features.length > 0) ? newProp.features : prev.property.features,
            coverImageUrl: newProp.coverImageUrl || prev.property.coverImageUrl,
            images: (newProp.images && newProp.images.length > 0) ? newProp.images : prev.property.images,
          },
          knowledgeBase: {
            ...prev.knowledgeBase,
            rawScrapedMarkdown: newKb.rawScrapedMarkdown || prev.knowledgeBase.rawScrapedMarkdown,
            synthesizedSalesPitch: newKb.synthesizedSalesPitch || prev.knowledgeBase.synthesizedSalesPitch,
            neighborhoodSummary: newKb.neighborhoodSummary || prev.knowledgeBase.neighborhoodSummary,
            schoolDistrictInfo: newKb.schoolDistrictInfo || prev.knowledgeBase.schoolDistrictInfo,
            petPolicyDetail: newKb.petPolicyDetail || prev.knowledgeBase.petPolicyDetail,
            parkingDetail: newKb.parkingDetail || prev.knowledgeBase.parkingDetail,
            utilitiesDetail: newKb.utilitiesDetail || prev.knowledgeBase.utilitiesDetail,
            applicationProcess: newKb.applicationProcess || prev.knowledgeBase.applicationProcess,
            faqs: (newKb.faqs && newKb.faqs.length > 0) ? newKb.faqs : prev.knowledgeBase.faqs,
            agentTone: newKb.agentTone || prev.knowledgeBase.agentTone,
            greetingMessage: newKb.greetingMessage || prev.knowledgeBase.greetingMessage,
            contactEmail: newKb.contactEmail || prev.knowledgeBase.contactEmail || "",
            unknownFallbackPolicy: newKb.unknownFallbackPolicy || prev.knowledgeBase.unknownFallbackPolicy,
            kbData: hyperLocalDataRef.current || prev.knowledgeBase.kbData,
            eaScript: eaScriptRef.current || prev.knowledgeBase.eaScript,
          },
          negotiationMatrix: {
            ...prev.negotiationMatrix,
            targetPrice: newMatrix.targetPrice || prev.negotiationMatrix.targetPrice,
            minFloorPrice: newMatrix.minFloorPrice || prev.negotiationMatrix.minFloorPrice,
            maxAllowedDiscountPct: newMatrix.maxAllowedDiscountPct || prev.negotiationMatrix.maxAllowedDiscountPct,
            concessionRules: (newMatrix.concessionRules && newMatrix.concessionRules.length > 0) ? newMatrix.concessionRules : prev.negotiationMatrix.concessionRules,
            notesForAgent: newMatrix.notesForAgent || prev.negotiationMatrix.notesForAgent,
          },
        };
      });
    } catch (err) {
      console.error("Chat update error:", err);
      setPipelineError(err instanceof Error ? err.message : "The knowledge-base synthesis failed.");
    } finally {
      setIsProcessing(false);
      setActivePipelineStep(null);
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
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
            eaScript: eaScriptRef.current || data.knowledgeBase.eaScript,
          },
          negotiationMatrix: data.negotiationMatrix,
          draftId: draftIdRef.current,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowFinalModal(false);
        setShowUploadModal(false);
        setShowHyperLocalModal(false);
        setPublishedResult({
          property: json.property,
          qrCodeSvg: json.qrCodeSvg,
          shareUrl: json.shareUrl,
        });
      } else {
        alert(json.error || "Failed to publish listing.");
      }
    } catch (err) {
      console.error("Publishing error:", err);
      alert("An unexpected error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

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
            Converse naturally with Elena Vance or import a listing URL to dynamically extract property specs and deploy a 24/7 Voice Sales Agent.
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

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Conversational Ingestion Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
          <ConversationalPanel
            onIngestUrl={handleIngestUrl}
            onSendMessage={handleSendMessage}
            onTurnExtraction={handleTurnExtraction}
            onUIAction={handleUIAction}
            onLogEvent={addTelemetryLog}
            onVoiceStateSync={handleVoiceStateSync}
            isProcessing={isProcessing}
            activePipelineStep={activePipelineStep}
            pipelineError={pipelineError}
          />
        </div>

        {/* Right Column: Live Real-Time Property Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
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
            isExtracting={isProcessing}
            isTurnSyncing={isTurnSyncing}
            isEnrichingLocation={isEnrichingLocation}
            hyperLocalData={hyperLocalData}
            enrichmentError={enrichmentError}
          />
        </div>
      </div>

      {/* 1. Core Specs Review Modal (Stage 2: 6/6 Core Specs Verified) */}
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

      {/* 2. Additional Specs Review Modal (Stage 4) */}
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
        />
      )}

      {/* 2.5 Hyper-Local & Transit Intelligence Modal (Stage 4.5) */}
      <HyperLocalModal
        isOpen={showHyperLocalModal}
        onClose={() => setShowHyperLocalModal(false)}
        onConfirm={handleConfirmHyperLocal}
        data={hyperLocalData}
        propertyAddress={data.property.address}
        city={data.property.city || undefined}
        isLoading={isEnrichingLocation}
      />

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
        onImagesUpdated={(newImages) => {
          setData((prev) => ({
            ...prev,
            property: {
              ...prev.property,
              images: newImages,
              coverImageUrl: prev.property.coverImageUrl || newImages[0] || "",
            },
          }));
        }}
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
          });
        }}
        syncStatus={{
          isTurnSyncing,
          pendingFinalModalOpen: isFinalGateLatched,
          onboardingStage,
          availableDate: data.property.availableDate,
          sessionUsage,
        }}
      />
    </div>
  );
}
