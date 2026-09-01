"use client";

import { useState } from "react";
import { ConversationalPanel } from "./ConversationalPanel";
import { LivePropertyInspector } from "./LivePropertyInspector";
import { PublishSuccessModal } from "./PublishSuccessModal";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { ArrowLeft, Building2, Sparkles } from "lucide-react";
import Link from "next/link";

const initialDraftState: ExtractedPropertyPayload = {
  property: {
    title: "Luxury 2-Bedroom Marina Loft with Golden Gate Views",
    slug: "luxury-marina-loft-san-francisco",
    description:
      "Stunning high-floor residence featuring panoramic views, chef's kitchen, hardwood floors, in-unit laundry, and private outdoor balcony.",
    listingType: "rent",
    propertyType: "apartment",
    price: 3450,
    securityDeposit: 3450,
    minLeaseMonths: 12,
    hoaFeeMonthly: 0,
    address: "250 Marina Boulevard",
    unitNumber: "Unit 4B",
    city: "San Francisco",
    state: "CA",
    zipCode: "94123",
    country: "USA",
    bedrooms: 2,
    bathrooms: 2.0,
    sqft: 1150,
    yearBuilt: 2021,
    availableDate: "Immediate",
    amenities: [
      "In-unit Washer/Dryer",
      "Dedicated Garage Parking",
      "EV Charging",
      "Private Balcony",
      "Rooftop Terrace",
    ],
    features: ["Hardwood Flooring", "Quartz Countertops", "High Ceilings"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  knowledgeBase: {
    rawScrapedMarkdown: "",
    synthesizedSalesPitch:
      "Welcome to 250 Marina Boulevard! This home offers rare panoramic bay views, in-unit laundry, and private garage parking in one of the city's most walkable neighborhoods.",
    neighborhoodSummary:
      "Prime Marina location with a 98 WalkScore, steps away from Chestnut Street restaurants, cafes, and the waterfront.",
    schoolDistrictInfo: "Top-rated San Francisco Unified School District.",
    petPolicyDetail: "Dogs and cats welcome (under 50 lbs) with $500 pet deposit and $50/month pet rent.",
    parkingDetail: "1 assigned underground garage parking stall with EV charger included.",
    utilitiesDetail: "Water, sewer, and trash removal are covered. Tenant is responsible for electricity and internet.",
    applicationProcess:
      "Online application, 680+ credit score required, gross monthly income 2.5x rent.",
    faqs: [
      {
        question: "What utilities are included in the rent?",
        answer: "Water, trash, and sewer are included. Tenant pays electric and WiFi.",
        category: "Policies & Rules",
      },
      {
        question: "Is parking included?",
        answer: "Yes, one assigned garage parking space with Level 2 EV charging is included.",
        category: "Amenities & Specs",
      },
      {
        question: "Is the price negotiable?",
        answer: "We can discuss a 5% discount if you are open to an 18-month lease commitment.",
        category: "Pricing & Lease",
      },
    ],
    agentTone: "warm_professional",
    greetingMessage:
      "Hello! Thanks for checking out 250 Marina Boulevard. Are you looking to move in this month?",
  },
  negotiationMatrix: {
    allowNegotiation: true,
    targetPrice: 3450,
    minFloorPrice: 3250,
    maxAllowedDiscountPct: 5.0,
    concessionRules: [
      {
        condition: "18_month_lease",
        concession: "5% discount on monthly rent ($3,277/mo)",
        maxConcessionValue: 173,
        requiresApproval: false,
      },
      {
        condition: "move_in_under_7_days",
        concession: "Waived first month parking fee ($200 value)",
        maxConcessionValue: 200,
        requiresApproval: false,
      },
    ],
    notesForAgent: "Strictly adhere to the $3,250 floor price. Proactively offer tours for qualified callers.",
  },
};

export function OnboardingStudio() {
  const [data, setData] = useState<ExtractedPropertyPayload>(initialDraftState);
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
    setActivePipelineStep("Updating knowledge base & guardrails from your instructions...");

    try {
      const res = await fetch(`${basePath}/api/onboarding/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationText: text,
          markdown: data.knowledgeBase.rawScrapedMarkdown || "",
          existingImages: data.property.images,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
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
            isProcessing={isProcessing}
            activePipelineStep={activePipelineStep}
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
