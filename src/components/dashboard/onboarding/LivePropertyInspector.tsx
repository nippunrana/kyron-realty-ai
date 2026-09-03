"use client";

import { useState } from "react";
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Tag,
  MessageSquare,
  Scale,
  Plus,
  Loader2,
  PawPrint,
  Car,
  Zap,
  Lock,
  Clock,
} from "lucide-react";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";
import { VerificationChecklist, ChecklistItemData } from "./VerificationChecklist";

interface LivePropertyInspectorProps {
  data: ExtractedPropertyPayload;
  onUpdateProperty: (updates: Partial<ExtractedPropertyPayload["property"]>) => void;
  onUpdateKnowledgeBase: (updates: Partial<ExtractedPropertyPayload["knowledgeBase"]>) => void;
  onUpdateNegotiationMatrix: (updates: Partial<ExtractedPropertyPayload["negotiationMatrix"]>) => void;
  onPublish: () => void;
  isPublishing: boolean;
  isExtracting: boolean;
}

export function LivePropertyInspector({
  data,
  onUpdateProperty,
  onUpdateKnowledgeBase,
  onUpdateNegotiationMatrix,
  onPublish,
  isPublishing,
  isExtracting,
}: LivePropertyInspectorProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "knowledge" | "guardrails">("specs");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [newAmenity, setNewAmenity] = useState("");

  const { property, knowledgeBase, negotiationMatrix } = data;
  const hasImages = Boolean(
    (property.images && property.images.length > 0) || property.coverImageUrl
  );
  const images = hasImages
    ? property.images && property.images.length > 0
      ? property.images
      : [property.coverImageUrl!]
    : [];
  const currentImage = images[activeImageIdx] || images[0];

  // 6-Point Dynamic Verification Checklist Items
  const hasListingType = Boolean(
    property.listingType === "rent" || property.listingType === "sale"
  );
  const hasAddress = Boolean(property.address && property.address.trim().length > 0);
  const hasPrice = Number(property.price) > 0;
  const hasBeds = Number(property.bedrooms) > 0;
  const hasBaths = Number(property.bathrooms) > 0;
  const hasSqft = Number(property.sqft) > 0;

  const checklistItems: ChecklistItemData[] = [
    {
      id: "listing_type",
      label: "Listing Type",
      sublabel: "Rent vs. Sale",
      isComplete: hasListingType,
      valueDisplay: hasListingType
        ? property.listingType === "rent"
          ? "For Rent"
          : "For Sale"
        : null,
    },
    {
      id: "address",
      label: "Location & Address",
      sublabel: "Street, City, State",
      isComplete: hasAddress,
      valueDisplay: hasAddress
        ? `${property.address}${property.city ? `, ${property.city}` : ""}`
        : null,
    },
    {
      id: "price",
      label: "Price / Monthly Rent",
      sublabel: "Asking price or monthly rent",
      isComplete: hasPrice,
      valueDisplay: hasPrice
        ? `$${Number(property.price).toLocaleString()}${
            property.listingType === "rent" ? "/mo" : ""
          }`
        : null,
    },
    {
      id: "bedrooms",
      label: "Bedrooms count",
      sublabel: "Number of bedrooms",
      isComplete: hasBeds,
      valueDisplay: hasBeds ? `${property.bedrooms} Beds` : null,
    },
    {
      id: "bathrooms",
      label: "Bathrooms count",
      sublabel: "Number of full/half baths",
      isComplete: hasBaths,
      valueDisplay: hasBaths ? `${property.bathrooms} Baths` : null,
    },
    {
      id: "sqft",
      label: "Square footage / Size",
      sublabel: "Interior floor area (sf)",
      isComplete: hasSqft,
      valueDisplay: hasSqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
    },
  ];

  const verifiedCount = checklistItems.filter((item) => item.isComplete).length;
  const isFullyVerified = verifiedCount === 6;

  const handleAddAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmenity.trim()) {
      onUpdateProperty({
        amenities: [...(property.amenities || []), newAmenity.trim()],
      });
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (idxToRemove: number) => {
    onUpdateProperty({
      amenities: (property.amenities || []).filter((_, idx) => idx !== idxToRemove),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 overflow-hidden relative">
      {/* Extraction Overlay Spinner if AI is parsing */}
      {isExtracting && (
        <div className="absolute inset-0 z-30 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 animate-bounce">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Synthesizing Property Intelligence...
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Extracting core specs, spoken FAQs, and concession rules
          </p>
        </div>
      )}

      {/* Top Header & Verification Status */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isFullyVerified
                ? "bg-emerald-500 animate-pulse"
                : "bg-blue-500 animate-pulse"
            }`}
          />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Property Inspector
          </span>
        </div>
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-colors ${
            isFullyVerified
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isFullyVerified ? "6/6 Verified by AI" : `${verifiedCount}/6 Verified`}</span>
        </div>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Photo Gallery Hero OR Light-Mode Architectural Placeholder */}
        {hasImages ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-16/9 group border border-slate-200/80 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={property.title || "Property"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

            {/* Type & Status Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/20">
                {property.listingType === "rent" ? "For Rent" : "For Sale"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider">
                {property.propertyType}
              </span>
            </div>

            {/* Bottom Title & Location Overlay */}
            <div className="absolute bottom-3 inset-x-3 text-white">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  {property.address
                    ? `${property.address}, ${property.city || ""} ${property.state || ""} ${property.zipCode || ""}`
                    : "Address pending"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight leading-snug line-clamp-1">
                {property.title || "Waiting for property details..."}
              </h3>
            </div>
          </div>
        ) : (
          /* Light-mode Architectural Placeholder Hero Area */
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 aspect-16/9 border-2 border-dashed border-slate-200/90 flex flex-col items-center justify-center p-6 text-center shadow-xs">
            {/* Architectural Blueprint Decorative Watermark */}
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 mb-3">
              <Building2 className="w-7 h-7 stroke-[1.5]" />
            </div>

            <h3 className="text-base font-extrabold tracking-tight text-slate-900">
              Waiting for property details...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Connect to the Voice Agent on the left or paste a listing URL to automatically extract property specs and photos in real time.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-slate-600 text-[11px] font-semibold shadow-2xs">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Empty Inspector State</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold">
                <span>0/6 Attributes Verified</span>
              </span>
            </div>
          </div>
        )}

        {/* Thumbnail Selector (if multiple images) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative w-14 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  activeImageIdx === idx
                    ? "border-blue-600 shadow-sm"
                    : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* 6-Point Dynamic Verification Checklist */}
        <VerificationChecklist
          items={checklistItems}
          verifiedCount={verifiedCount}
        />

        {/* Primary Metrics Bar (Dimmed when empty, bold when extracted) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900">
          {/* Price */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              {property.listingType === "rent" ? "Monthly Rent" : "Asking Price"}
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                placeholder="--"
                value={property.price || ""}
                onChange={(e) => onUpdateProperty({ price: Number(e.target.value) })}
                className={`w-full text-sm font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 ${
                  hasPrice ? "text-slate-900" : "text-slate-400 font-normal"
                }`}
              />
            </div>
          </div>

          {/* Beds */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Bedrooms
            </label>
            <div className="flex items-center gap-1.5">
              <Bed className={`w-3.5 h-3.5 ${hasBeds ? "text-blue-600" : "text-slate-400"}`} />
              <input
                type="number"
                placeholder="--"
                value={property.bedrooms || ""}
                onChange={(e) => onUpdateProperty({ bedrooms: Number(e.target.value) })}
                className={`w-full text-sm font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 ${
                  hasBeds ? "text-slate-900" : "text-slate-400 font-normal"
                }`}
              />
            </div>
          </div>

          {/* Baths */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Bathrooms
            </label>
            <div className="flex items-center gap-1.5">
              <Bath className={`w-3.5 h-3.5 ${hasBaths ? "text-blue-600" : "text-slate-400"}`} />
              <input
                type="number"
                step="0.5"
                placeholder="--"
                value={property.bathrooms || ""}
                onChange={(e) => onUpdateProperty({ bathrooms: Number(e.target.value) })}
                className={`w-full text-sm font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 ${
                  hasBaths ? "text-slate-900" : "text-slate-400 font-normal"
                }`}
              />
            </div>
          </div>

          {/* Sqft */}
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              Floor Area
            </label>
            <div className="flex items-center gap-1.5">
              <Maximize className={`w-3.5 h-3.5 ${hasSqft ? "text-blue-600" : "text-slate-400"}`} />
              <input
                type="number"
                placeholder="--"
                value={property.sqft || ""}
                onChange={(e) => onUpdateProperty({ sqft: Number(e.target.value) })}
                className={`w-full text-sm font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 ${
                  hasSqft ? "text-slate-900" : "text-slate-400 font-normal"
                }`}
              />
              <span className="text-[10px] font-semibold text-slate-400">sf</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher for Deep Inspection */}
        <div className="border-b border-slate-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "specs"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Specs & Amenities</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("knowledge")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "knowledge"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Voice Agent Brain</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("guardrails")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "guardrails"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Concession Guardrails</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Specs & Amenities */}
        {activeTab === "specs" && (
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            {/* Title & Description */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Listing Title
              </label>
              <input
                type="text"
                placeholder="e.g. Modern Marina Loft with Bay Views"
                value={property.title || ""}
                onChange={(e) => onUpdateProperty({ title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Listing description synthesized by AI or entered manually..."
                value={property.description || ""}
                onChange={(e) => onUpdateProperty({ description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Amenities Chips */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Key Amenities ({property.amenities?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(property.amenities || []).map((amenity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-medium"
                  >
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="text-blue-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(!property.amenities || property.amenities.length === 0) && (
                  <span className="text-[11px] text-slate-400 italic">
                    No amenities added yet. Speak or type to add amenities.
                  </span>
                )}
              </div>

              {/* Add Amenity Form */}
              <form onSubmit={handleAddAmenity} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom amenity (e.g. EV Charger, In-unit W/D)..."
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: Voice Agent Brain & FAQs */}
        {activeTab === "knowledge" && (
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            {/* Speech Pitch Preview */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                  🎙️
                </div>
                <span className="text-xs font-bold text-blue-900">
                  Voice Agent Spoken Elevator Pitch
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="The AI voice agent will automatically synthesize a spoken elevator pitch once property details are provided..."
                value={knowledgeBase.synthesizedSalesPitch || ""}
                onChange={(e) =>
                  onUpdateKnowledgeBase({ synthesizedSalesPitch: e.target.value })
                }
                className="w-full text-xs text-blue-950 font-medium bg-white/80 border border-blue-200/80 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-blue-700 mt-1">
                💡 This is what the Agora Voice Agent will naturally speak to inbound callers when they inquire.
              </p>
            </div>

            {/* Policy Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                  <PawPrint className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pets</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {knowledgeBase.petPolicyDetail || "Policies will populate from onboarding interview"}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  <span>Parking</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {knowledgeBase.parkingDetail || "Garage / stall rules will populate automatically"}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Utilities</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {knowledgeBase.utilitiesDetail || "Included vs. tenant-paid utility breakdown"}
                </p>
              </div>
            </div>

            {/* Categorized FAQs */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Knowledge Base FAQs ({knowledgeBase.faqs?.length || 0})
              </label>
              {knowledgeBase.faqs && knowledgeBase.faqs.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {knowledgeBase.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {faq.category}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mb-0.5">
                        Q: {faq.question}
                      </div>
                      <div className="text-slate-600 text-[11px] leading-relaxed">
                        A: {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Spoken-optimized FAQs will be synthesized by Gemini AI once property specs are extracted.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Negotiation Guardrails */}
        {activeTab === "guardrails" && (
          <div className="space-y-4 text-xs animate-in fade-in duration-150">
            {/* Price Floor & Concession Alert */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900 text-xs">
                    Hard Floor Price Lock
                  </span>
                </div>
                <span className="text-xs font-extrabold text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded-md">
                  {negotiationMatrix.minFloorPrice
                    ? `$${Number(negotiationMatrix.minFloorPrice).toLocaleString()}${
                        property.listingType === "rent" ? "/mo" : ""
                      }`
                    : "$ --"}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                The Agora AI voice sales agent is mathematically prohibited from accepting or proposing any price below this floor.
              </p>
            </div>

            {/* Concession Rules Table */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Exchange-of-Value Concession Rules
              </label>
              {negotiationMatrix.concessionRules &&
              negotiationMatrix.concessionRules.length > 0 ? (
                <div className="space-y-2">
                  {negotiationMatrix.concessionRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <span>Trigger: {rule.condition.replace(/_/g, " ")}</span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">
                          Concession: <strong className="text-emerald-700">{rule.concession}</strong>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                        Pre-Approved
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Exchange-of-value concession rules will be generated upon price verification.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar (Locked until 6/6 verified) */}
      <div className="p-4 border-t border-slate-200 bg-white/90 backdrop-blur-md">
        {isFullyVerified ? (
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying 24/7 Voice Sales Agent...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Publish Listing & Deploy AI Voice Agent</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={true}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 border border-slate-200/90 text-slate-400 font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Publish Listing & Deploy AI Voice Agent</span>
          </button>
        )}

        <p className="text-[11px] text-center mt-2 flex items-center justify-center gap-1.5">
          {isFullyVerified ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600">
                Ready to Deploy • 6/6 Attributes Verified • Sub-300ms Agora voice response
              </span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">
                Locked • Complete all 6 verification items to publish ({verifiedCount}/6 complete)
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
