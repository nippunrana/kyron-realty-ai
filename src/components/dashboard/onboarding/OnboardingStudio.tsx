"use client";

import { useState } from "react";
import { ConversationalPanel } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";
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
            minFloorPrice: Math.round(updates.price * 0.94),
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
            minFloorPrice: Math.round(updates.price * 0.94),
          }
        : prev.negotiationMatrix,
    }));
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

  // Conversational Chat Update Handler
  const handleSendMessage = async (text: string) => {
    setIsProcessing(true);
    setActivePipelineStep("Updating knowledge base & guardrails with AI...");

    try {
      const res = await fetch(`${basePath}/api/onboarding/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationText: text,
          markdown: data.knowledgeBase.rawScrapedMarkdown || "",
          existingImages: data.property.images,
          currentPropertyState: data,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setData((prev) => ({
          property: {
            ...prev.property,
            ...json.data.property,
            price: json.data.property.price || prev.property.price,
            bedrooms: json.data.property.bedrooms || prev.property.bedrooms,
            bathrooms: json.data.property.bathrooms || prev.property.bathrooms,
            sqft: json.data.property.sqft || prev.property.sqft,
            address: json.data.property.address || prev.property.address,
            listingType: json.data.property.listingType || prev.property.listingType,
          },
          knowledgeBase: json.data.knowledgeBase,
          negotiationMatrix: json.data.negotiationMatrix,
        }));
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
            Create or import a listing to auto-generate verified knowledge bases and deploy a 24/7 Agora Voice Sales Agent.
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
            isPublishing={isPublishing}
            isExtracting={isProcessing}
          />
        </div>
      </div>

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
