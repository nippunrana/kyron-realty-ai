"use client";

import { useState, useRef, useCallback } from "react";
import { ConversationalPanel } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ReviewSpecsModal } from "./ReviewSpecsModal";
import { ExtractedPropertyPayload, TurnMessage } from "@/lib/kb-extractor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const emptyInitialDraftState: ExtractedPropertyPayload = {
  property: {
    title: "",
    slug: "",
    description: "",
    listingType: "" as any,
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

export function OnboardingStudio() {
  const [data, setData] = useState<ExtractedPropertyPayload>(emptyInitialDraftState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTurnSyncing, setIsTurnSyncing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const dataRef = useRef(data);
  dataRef.current = data;

  const voiceAgentActionsRef = useRef<{ sendTextMessage: (text: string) => void } | null>(null);
  const turnSequenceRef = useRef<number>(0);
  const turnAbortControllerRef = useRef<AbortController | null>(null);

  // Success Modal State
  const [publishedResult, setPublishedResult] = useState<{
    property: any;
    qrCodeSvg: string;
    shareUrl: string;
  } | null>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/projects/kyron-realty-ai";

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

  const handleQuickUpdate = (updates: Partial<ExtractedPropertyPayload["property"]>) => {
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

  const handleUIAction = useCallback((action: "open_review_modal" | "close_review_modal") => {
    if (action === "open_review_modal") {
      setShowReviewModal(true);
    } else if (action === "close_review_modal") {
      setShowReviewModal(false);
    }
  }, []);

  // Turn-level AI extraction with Latest-Wins concurrency
  const handleTurnExtraction = async (slidingWindow: TurnMessage[]) => {
    if (!slidingWindow || slidingWindow.length === 0) return;

    if (turnAbortControllerRef.current) {
      turnAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    turnAbortControllerRef.current = abortController;

    const sequenceId = ++turnSequenceRef.current;
    setIsTurnSyncing(true);

    try {
      const res = await fetch(`${basePath}/api/onboarding/extract-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slidingWindowMessages: slidingWindow,
          currentPropertyState: dataRef.current.property,
        }),
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) return;
      if (sequenceId !== turnSequenceRef.current) return;

      const json = await res.json();
      if (json.success && json.data?.modalAction) {
        if (json.data.modalAction === "open") {
          setShowReviewModal(true);
        } else if (json.data.modalAction === "close") {
          setShowReviewModal(false);
        }
      }

      if (json.success && json.data?.updates && Object.keys(json.data.updates).length > 0) {
        const updates = json.data.updates;

        setData((prev) => {
          const updatedProperty = { ...prev.property, ...updates };

          return {
            ...prev,
            property: updatedProperty,
            negotiationMatrix: updates.price
              ? {
                  ...prev.negotiationMatrix,
                  targetPrice: updates.price,
                  minFloorPrice: Math.round(updates.price * 0.94),
                }
              : prev.negotiationMatrix,
          };
        });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[Turn Extraction Client Error]:", err);
      }
    } finally {
      if (sequenceId === turnSequenceRef.current) {
        setIsTurnSyncing(false);
      }
    }
  };

  const handleUpdateKnowledgeBase = (
    updates: Partial<ExtractedPropertyPayload["knowledgeBase"]>
  ) => {
    setData((prev) => ({
      ...prev,
      knowledgeBase: { ...prev.knowledgeBase, ...updates },
    }));
  };

  const handleUpdateNegotiationMatrix = (
    updates: Partial<ExtractedPropertyPayload["negotiationMatrix"]>
  ) => {
    setData((prev) => ({
      ...prev,
      negotiationMatrix: { ...prev.negotiationMatrix, ...updates },
    }));
  };

  // URL Ingestion Handler
  const handleIngestUrl = async (url: string) => {
    setIsProcessing(true);
    setActivePipelineStep("Crawling listing webpage via Apify Actor...");

    try {
      // Step 1: Scrape URL
      const scrapeRes = await fetch(`${basePath}/api/onboarding/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const scrapeJson = await scrapeRes.json();
      const scrapedData = scrapeJson.data;

      // Step 2: Extract structured intelligence with Gemini
      setActivePipelineStep("Synthesizing property specs, FAQs, and voice sales pitch with AI...");
      const extractRes = await fetch(`${basePath}/api/onboarding/extract`, {
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
      if (extractJson.success && extractJson.data) {
        setData(extractJson.data);
      }
    } catch (err) {
      console.error("URL Ingestion error:", err);
    } finally {
      setIsProcessing(false);
      setActivePipelineStep(null);
    }
  };

  // Conversational Extraction Handler (invoked at call completion with owner dialogue)
  const handleSendMessage = async (text: string) => {
    if (!text || !text.trim()) return;

    setIsProcessing(true);
    setActivePipelineStep("Synthesizing voice intelligence & knowledge base...");

    try {
      const res = await fetch(`${basePath}/api/onboarding/extract`, {
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
      if (json.success && json.data) {
        setData((prev) => {
          const newProp = json.data.property || {};
          const newKb = json.data.knowledgeBase || {};
          const newMatrix = json.data.negotiationMatrix || {};

          return {
            property: {
              ...prev.property,
              title: newProp.title || prev.property.title,
              slug: newProp.slug || prev.property.slug,
              description: newProp.description || prev.property.description,
              // Protect live-verified specs: do not let end-of-call synthesis clobber them
              listingType: prev.property.listingType || newProp.listingType,
              propertyType: prev.property.propertyType || newProp.propertyType,
              price: prev.property.price > 0 ? prev.property.price : (newProp.price || 0),
              securityDeposit: newProp.securityDeposit || prev.property.securityDeposit,
              minLeaseMonths: newProp.minLeaseMonths || prev.property.minLeaseMonths,
              hoaFeeMonthly: newProp.hoaFeeMonthly || prev.property.hoaFeeMonthly,
              address: prev.property.address?.trim() ? prev.property.address : (newProp.address || ""),
              unitNumber: newProp.unitNumber || prev.property.unitNumber,
              city: prev.property.city?.trim() ? prev.property.city : (newProp.city || ""),
              state: prev.property.state?.trim() ? prev.property.state : (newProp.state || ""),
              zipCode: prev.property.zipCode?.trim() ? prev.property.zipCode : (newProp.zipCode || ""),
              country: "USA",
              bedrooms: prev.property.bedrooms > 0 ? prev.property.bedrooms : (newProp.bedrooms || 0),
              bathrooms: prev.property.bathrooms > 0 ? prev.property.bathrooms : (newProp.bathrooms || 0),
              sqft: prev.property.sqft > 0 ? prev.property.sqft : (newProp.sqft || 0),
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
      }
    } catch (err) {
      console.error("Chat update error:", err);
    } finally {
      setIsProcessing(false);
      setActivePipelineStep(null);
    }
  };

  // Publish Handler
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`${basePath}/api/properties/create`, {
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
    <div className="flex flex-col flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
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

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Property Onboarding Studio</span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Voice & AI
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Converse naturally with Elena Vance or import a listing URL to dynamically extract property specs and deploy a 24/7 Voice Sales Agent.
          </p>
        </div>
      </div>

      {/* Split-Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[640px]">
        {/* Left Column: Conversational Ingestion Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <ConversationalPanel
            onIngestUrl={handleIngestUrl}
            onSendMessage={handleSendMessage}
            onQuickUpdate={handleQuickUpdate}
            onTurnExtraction={handleTurnExtraction}
            onVoiceAgentReady={(actions) => {
              voiceAgentActionsRef.current = actions;
            }}
            onUIAction={handleUIAction}
            isProcessing={isProcessing}
            activePipelineStep={activePipelineStep}
            currentProperty={data.property}
          />
        </div>

        {/* Right Column: Live Real-Time Property Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          <LivePropertyInspector
            data={data}
            onUpdateProperty={handleUpdateProperty}
            onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
            onUpdateNegotiationMatrix={handleUpdateNegotiationMatrix}
            onPublish={handlePublish}
            onOpenReviewModal={() => setShowReviewModal(true)}
            isPublishing={isPublishing}
            isExtracting={isProcessing}
            isTurnSyncing={isTurnSyncing}
          />
        </div>
      </div>

      {/* Review Specs Modal (Pops up when 6/6 parameters are verified) */}
      {showReviewModal && (
        <ReviewSpecsModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          property={data.property}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      )}

      {/* Success Launchpad Modal */}
      {publishedResult && (
        <PublishSuccessModal
          isOpen={!!publishedResult}
          onClose={() => setPublishedResult(null)}
          property={publishedResult.property}
          qrCodeSvg={publishedResult.qrCodeSvg}
          shareUrl={publishedResult.shareUrl}
        />
      )}
    </div>
  );
}
