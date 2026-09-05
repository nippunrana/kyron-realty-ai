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
  Mail,
} from "lucide-react";
import { ExtractedPropertyPayload } from "@/lib/kb-extractor";

interface ReviewSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: ExtractedPropertyPayload["property"];
  contactEmail?: string;
  ownerName?: string;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
}

export function ReviewSpecsModal({
  isOpen,
  onClose,
  property,
  contactEmail,
  ownerName,
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
    .join(", ") || "Address pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden text-slate-900">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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

        {/* 1. HERO LOCATION SPOTLIGHT CARD (Full Width - Zero Truncation) */}
        <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border border-emerald-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Property Location & Address
                </span>
                <p className="text-[11px] text-slate-500 font-medium">
                  Verified primary street and municipal location
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verified Location</span>
            </span>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-emerald-100/70">
            <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug break-words">
              {fullAddress}
            </p>
          </div>
        </div>

        {/* 2. ROW 1: FINANCIALS & CONTRACT TYPE (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Listing Type Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border text-blue-600 bg-blue-50 border-blue-200 shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Contract Type
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {isRent ? "For Rent" : property.listingType === "sale" ? "For Sale" : "Pending"}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              {isRent ? "Rental" : "Sale"}
            </span>
          </div>

          {/* Price Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border text-indigo-600 bg-indigo-50 border-indigo-200 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {isRent ? "Monthly Target Rent" : "Target Asking Price"}
                </span>
                <p className="text-sm font-extrabold text-slate-900">
                  {formattedPrice}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              {isRent ? "/month" : "Asking"}
            </span>
          </div>
        </div>

        {/* 3. ROW 2: FLOORPLAN & SPATIAL SPECS (3 Columns) */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Bedrooms */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border text-amber-600 bg-amber-50 border-amber-200 shrink-0">
                <Bed className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Bedrooms
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900">
              {property.bedrooms !== undefined && property.bedrooms !== null ? `${property.bedrooms} Beds` : "Pending"}
            </p>
          </div>

          {/* Bathrooms */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border text-cyan-600 bg-cyan-50 border-cyan-200 shrink-0">
                <Bath className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Bathrooms
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900">
              {property.bathrooms !== undefined && property.bathrooms !== null ? `${property.bathrooms} Baths` : "Pending"}
            </p>
          </div>

          {/* Floor Area */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border text-purple-600 bg-purple-50 border-purple-200 shrink-0">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Floor Area
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900">
              {Number(property.sqft) > 0 ? `${Number(property.sqft).toLocaleString()} sqft` : "Pending"}
            </p>
          </div>
        </div>

        {/* Verified Listing Contact Spotlight */}
        {contactEmail && (
          <div className="mb-4 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border text-blue-600 bg-blue-50 border-blue-200 shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Public Listing Contact
                </span>
                <span className="text-xs font-extrabold text-slate-900 truncate block">
                  {contactEmail} {ownerName ? `(${ownerName})` : ""}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Verified Contact</span>
            </span>
          </div>
        )}

        {/* 4. Live Voice Corrections Active Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 mb-6 flex items-start gap-3 text-xs text-blue-900">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Mic className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex-1 leading-relaxed">
            <span className="font-bold">Live voice corrections active:</span> If you want to change any detail, simply speak naturally to Elena (e.g. <span className="font-semibold italic">“Actually Elena, change the price to $4,000”</span>) and this review card will update live in real time.
          </div>
        </div>

        {/* 5. Action Buttons */}
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

