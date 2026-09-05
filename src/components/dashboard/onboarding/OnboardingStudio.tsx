"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ConversationalPanel } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ReviewSpecsModal } from "./ReviewSpecsModal";
import { areCoreSpecsVerified, getCoreSpecStatus } from "./inspector-specs";
import type { UIAction } from "@/hooks/voice-agent-types";
import type { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import type { TurnMessage } from "@/lib/turn-extractor";
import { computeFloorPrice } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";
import { ArrowLeft } from "lucide-react";
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
    country: "USA",
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
}

export function OnboardingStudio({ user }: OnboardingStudioProps) {
  const [data, setData] = useState<ExtractedPropertyPayload>(() => ({
    ...emptyInitialDraftState,
    knowledgeBase: {
      ...emptyInitialDraftState.knowledgeBase,
      contactEmail: user?.email || "",
    },
  }));
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [isTurnSyncing, setIsTurnSyncing] = useState(false);
  const [onboardingStage, setOnboardingStage] = useState<"core" | "additional_specs" | "final_review">("core");
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);

  // Latest state for async turn-extraction and voice callbacks; synced after each commit
  const dataRef = useRef(data);
  const onboardingStageRef = useRef(onboardingStage);
  useEffect(() => {
    dataRef.current = data;
    onboardingStageRef.current = onboardingStage;
  }, [data, onboardingStage]);

  const turnSequenceRef = useRef<number>(0);
  const isExtractionBusyRef = useRef<boolean>(false);
  const pendingExtractionWindowRef = useRef<TurnMessage[] | null>(null);
  const pendingModalOpenRef = useRef<boolean>(false);
  const isTurnSyncingRef = useRef<boolean>(false);

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

  // Transition from Stage 1 (Core Specs) to Stage 2 (Additional Specs)
  const handleConfirmCoreSpecs = useCallback(() => {
    setShowCoreModal(false);
    setOnboardingStage("additional_specs");
  }, []);

  const handleUIAction = useCallback((action: UIAction) => {
    if (action === "open_review_modal") {
      if (onboardingStageRef.current === "core") {
        // If all 6 specs are already verified, open immediately
        if (areCoreSpecsVerified(dataRef.current.property)) {
          setShowCoreModal(true);
          pendingModalOpenRef.current = false;
        } else if (isTurnSyncingRef.current) {
          // If turn extraction is currently in flight, latch the modal open request
          // so it pops the instant the 6/6 specs arrive from Gemini with zero blanks
          pendingModalOpenRef.current = true;
        }
      } else {
        setShowFinalModal(true);
      }
    } else if (action === "close_review_modal") {
      setShowCoreModal(false);
      setShowFinalModal(false);
      pendingModalOpenRef.current = false;
      if (onboardingStageRef.current === "core" && areCoreSpecsVerified(dataRef.current.property)) {
        handleConfirmCoreSpecs();
      }
    }
  }, [handleConfirmCoreSpecs]);

  // Trailing Conflating Queue: In-flight Gemini extractions run to completion
  // without being cancelled. Consecutive or fast turns coalesce into a single follow-up call.
  const executeTurnExtraction = async (slidingWindow: TurnMessage[]) => {
    isExtractionBusyRef.current = true;
    setIsTurnSyncing(true);
    isTurnSyncingRef.current = true;
    const sequenceId = ++turnSequenceRef.current;

    try {
      const res = await fetch(`${BASE_PATH}/api/onboarding/extract-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slidingWindowMessages: slidingWindow,
          currentPropertyState: dataRef.current.property,
        }),
      });

      const json = await res.json();
      let candidateProperty = { ...dataRef.current.property };

      if (json.success && json.data?.updates && Object.keys(json.data.updates).length > 0) {
        const updates = json.data.updates;
        const {
          contactEmail,
          parkingDetail,
          petPolicyDetail,
          utilitiesDetail,
          features: newFeatures,
          amenities: newAmenities,
          ...propertyUpdates
        } = updates;

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
      }

      // Check if all 6 core specs are now verified in state
      const isCoreComplete = areCoreSpecsVerified(candidateProperty);

      // In-Flight Sync Gate: If Elena or the user requested the review modal while
      // extraction was in flight, open it now that all 6 specs have safely landed!
      if (isCoreComplete && pendingModalOpenRef.current && onboardingStageRef.current === "core") {
        pendingModalOpenRef.current = false;
        setShowCoreModal(true);
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
          handleConfirmCoreSpecs();
        } else if (action === "open_final") {
          setShowFinalModal(true);
        } else if (action === "close_final") {
          setShowFinalModal(false);
        } else if (action === "open") {
          if (onboardingStageRef.current === "core") {
            if (isCoreComplete) {
              setShowCoreModal(true);
            } else {
              pendingModalOpenRef.current = true;
            }
          } else {
            setShowFinalModal(true);
          }
        } else if (action === "close") {
          if (onboardingStageRef.current === "core") {
            handleConfirmCoreSpecs();
          } else {
            setShowFinalModal(false);
          }
        }
      }
    } catch (err: any) {
      console.error("[Turn Extraction Client Error]:", err);
    } finally {
      // If new turns arrived while this extraction was in flight, execute the latest coalesced snapshot
      const pendingSnapshot = pendingExtractionWindowRef.current;
      pendingExtractionWindowRef.current = null;

      if (pendingSnapshot && pendingSnapshot.length > 0) {
        executeTurnExtraction(pendingSnapshot);
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

    if (isExtractionBusyRef.current) {
      // Coalesce into pending snapshot: latest conversational state always wins
      pendingExtractionWindowRef.current = slidingWindow;
      return;
    }

    executeTurnExtraction(slidingWindow);
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
      if (!json.success || !json.data) {
        throw new Error(json.error || "Knowledge-base synthesis failed.");
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
            country: "USA",
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
          knowledgeBase: data.knowledgeBase,
          negotiationMatrix: data.negotiationMatrix,
        }),
      });

      const json = await res.json();
      if (json.success) {
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
            onUpdateProperty={handleUpdateProperty}
            onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
            onPublish={handlePublish}
            onOpenCoreModal={() => setShowCoreModal(true)}
            onOpenReviewModal={() => {
              if (onboardingStage === "core") {
                setShowCoreModal(true);
              } else {
                setShowFinalModal(true);
              }
            }}
            isPublishing={isPublishing}
            isExtracting={isProcessing}
            isTurnSyncing={isTurnSyncing}
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
        />
      )}

      {/* 2. Final Unified Review Modal (Stage 5: Final Review & Deploy) */}
      {showFinalModal && (
        <ReviewSpecsModal
          mode="final"
          onClose={() => setShowFinalModal(false)}
          property={data.property}
          knowledgeBase={data.knowledgeBase}
          contactEmail={data.knowledgeBase.contactEmail || user?.email || ""}
          ownerName={user?.name || ""}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      )}

      {/* Success Launchpad Modal */}
      {publishedResult && (
        <PublishSuccessModal
          onClose={() => setPublishedResult(null)}
          property={publishedResult.property}
          qrCodeSvg={publishedResult.qrCodeSvg}
          shareUrl={publishedResult.shareUrl}
        />
      )}
    </div>
  );
}
