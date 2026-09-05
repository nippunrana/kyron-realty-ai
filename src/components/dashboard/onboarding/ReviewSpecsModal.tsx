"use client";

import {
  CheckCircle2,
  Sparkles,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Maximize2,
  Tag,
  ArrowRight,
  Mic,
  Loader2,
  X,
} from "lucide-react";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";

interface ReviewSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ExtractedPropertyPayload["property"];
  onPublish: () => Promise<void>;
  isPublishing: boolean;
}

export function ReviewSpecsModal({
  isOpen,
  onClose,
  property,
  onPublish,
  isPublishing,
}: ReviewSpecsModalProps) {
  if (!isOpen) return null;

  const isRent = property.listingType === "rent";
  const formattedPrice = Number(property.price) > 0
    ? `$${Number(property.price).toLocaleString()}${isRent ? "/mo" : ""}`
    : "Pending";

  const fullAddress = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ") || "Pending";

  const specs = [
    {
      id: "listingType",
      label: "Listing Type",
      value: isRent ? "For Rent" : property.listingType === "sale" ? "For Sale" : "Pending",
      icon: Tag,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      id: "address",
      label: "Location & Address",
      value: fullAddress,
      icon: MapPin,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      id: "price",
      label: isRent ? "Monthly Rent" : "Target Price",
      value: formattedPrice,
      icon: DollarSign,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      id: "bedrooms",
      label: "Bedrooms",
      value: property.bedrooms !== undefined && property.bedrooms !== null ? `${property.bedrooms} Beds` : "Pending",
      icon: Bed,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      id: "bathrooms",
      label: "Bathrooms",
      value: property.bathrooms !== undefined && property.bathrooms !== null ? `${property.bathrooms} Baths` : "Pending",
      icon: Bath,
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
    {
      id: "sqft",
      label: "Floor Area",
      value: Number(property.sqft) > 0 ? `${Number(property.sqft).toLocaleString()} sqft` : "Pending",
      icon: Maximize2,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 mx-auto mb-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>All 6 Parameters Verified</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Review Property Specifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Elena Vance has captured your listing details. Review them below before publishing.
          </p>
        </div>

        {/* 6-Grid Spec Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {specs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 truncate">
                    {item.label}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate" title={item.value}>
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Voice-Correction Active Hint Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 mb-6 flex items-start gap-3 text-xs text-blue-900">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">Live voice corrections active:</span> If you want to change any detail, simply speak naturally to Elena (e.g. <span className="font-semibold italic">“Actually Elena, change the price to $4,000”</span>) and this review card will update live in real time.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-xs font-bold text-slate-700 transition-all text-center cursor-pointer"
          >
            Continue Conversation
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Listing...</span>
              </>
            ) : (
              <>
                <span>Publish Listing & Deploy AI</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
