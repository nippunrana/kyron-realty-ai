"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Share2,
  Sparkles,
  CheckCircle2,
  Camera,
  BadgeCheck,
} from "lucide-react";
import { ShareListingModal } from "./ShareListingModal";
import { PropertySpecsBento } from "./PropertySpecsBento";
import { PropertyCommuteExplorer } from "./PropertyCommuteExplorer";
import { PropertyPoliciesFaqSection } from "./PropertyPoliciesFaqSection";
import { SarahVoiceConciergeCard } from "./SarahVoiceConciergeCard";
import { PublicListingFooter } from "./PublicListingFooter";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { BASE_PATH } from "@/lib/base-path";
import { formatPropertyTypeLabel } from "@/lib/property-types";
import type { PublicListingClientProps } from "@/lib/public-listing-types";

export function PublicListingClient({
  property,
  knowledgeBase,
  media,
  shareUrl,
}: PublicListingClientProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});
  const { copied, copy: copyShareUrl } = useCopyToClipboard();

  const sarahAvatarUrl = `${BASE_PATH}/images/salesagent.webp`;

  const handleOpenSarah = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-sales-agent"));
    }
  };

  const images =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : media.length > 0
      ? media.map((m) => m.url)
      : [
          property.coverImageUrl ||
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        ];

  const currentHeroImage = images[activeImageIdx] || images[0];

  const locationSummary = [property.city, property.state].filter(Boolean).join(", ") || property.address || "";
  const whatsAppText = encodeURIComponent(
    `🏡 Check out this property: ${property.title}${locationSummary ? ` in ${locationSummary}` : ""}!\n` +
    `Price: ₹${Number(property.price).toLocaleString("en-IN")}${property.listingType === "rent" ? "/mo" : ""}\n\n` +
    `Talk with our 24/7 AI Voice Agent for instant answers:\n${shareUrl}`
  );
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-28">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-900 shrink-0 group"
            >
              <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-tight text-sm sm:text-base">
                Kyron Realty
              </span>
            </Link>
            <span className="text-slate-300 text-xs shrink-0">/</span>
            <Link
              href="/listings"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors shrink-0"
            >
              All Listings
            </Link>
            {locationSummary && (
              <>
                <span className="text-slate-300 text-xs shrink-0">/</span>
                <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px] sm:max-w-xs">
                  {locationSummary}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & QR</span>
            </button>

            <button
              onClick={handleOpenSarah}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 ring-1 ring-white/50">
                <Image
                  src={sarahAvatarUrl}
                  alt="Sarah"
                  fill
                  sizes="16px"
                  unoptimized={true}
                  className="object-cover"
                />
              </div>
              <span>Talk to Sarah</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Photo Gallery & Hero Media Section */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Primary Hero Image (8 cols) */}
            <div className="lg:col-span-8 relative aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80">
              {failedImageUrls[currentHeroImage] ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
                    <Camera className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white max-w-sm mb-1 line-clamp-1">
                    {property.title}
                  </p>
                  <span className="text-xs text-slate-400 font-medium">Photo Preview Pending</span>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentHeroImage}
                  alt={property.title}
                  className="w-full h-full object-cover select-none"
                />
              )}

              {/* Status & Category Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold uppercase tracking-wider">
                  {property.listingType === "rent" ? "For Rent" : "For Sale"}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold">
                  {formatPropertyTypeLabel(property.propertyType)}
                </span>
              </div>

              {/* Verified Verification Badge */}
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-extrabold shadow-lg">
                <BadgeCheck className="w-4 h-4 text-blue-600" />
                <span>Verified by Kyron Realty AI</span>
              </div>
            </div>

            {/* Thumbnail Grid Strip (4 cols) */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative aspect-4/3 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx
                      ? "border-blue-600 shadow-md ring-2 ring-blue-500/20"
                      : "border-slate-200/80 opacity-70 hover:opacity-100"
                  }`}
                >
                  {failedImageUrls[img] ? (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center text-slate-400 p-2">
                      <Camera className="w-5 h-5 opacity-60 mb-1" />
                      <span className="text-[10px] text-slate-500 font-medium">Photo {idx + 1}</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt=""
                      onError={() => setFailedImageUrls((prev) => ({ ...prev, [img]: true }))}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2-Column Main Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Price & Specs Header, Voice Pitch, Commute Map, Amenities, Policies & FAQs (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Primary Price & Conversion Action Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {property.listingType === "rent" ? "Monthly Lease Price" : "Asking Price"}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    ₹{Number(property.price).toLocaleString("en-IN")}
                    {property.listingType === "rent" && (
                      <span className="text-base font-normal text-slate-500"> / month</span>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleOpenSarah}
                    className="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
                  >
                    <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-2 ring-white/40">
                      <Image
                        src={sarahAvatarUrl}
                        alt="Sarah"
                        fill
                        sizes="24px"
                        unoptimized={true}
                        className="object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-white" />
                    </div>
                    <span>Talk to Sarah</span>
                  </button>
                </div>
              </div>

              {/* Integrated Key Specifications Pill Strip */}
              <div className="pt-4 border-t border-slate-100">
                <PropertySpecsBento
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  washrooms={property.washrooms}
                  sqft={property.sqft}
                  availableDate={property.availableDate}
                  floorNumber={property.floorNumber}
                  storeys={property.storeys}
                  furnishingStatus={property.furnishingStatus}
                  yearBuilt={property.yearBuilt}
                  securityDeposit={property.securityDeposit}
                  minLeaseMonths={property.minLeaseMonths}
                  hoaFeeMonthly={property.hoaFeeMonthly}
                  listingType={property.listingType}
                />
              </div>
            </div>

            {/* Sarah AI Voice Elevator Pitch Feature Callout */}
            {knowledgeBase?.synthesizedSalesPitch && (
              <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                    🎙️
                  </div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI Leasing Advisor Preview</span>
                    </div>
                    <p className="text-sm sm:text-base font-medium leading-relaxed italic text-blue-50">
                      &ldquo;{knowledgeBase.synthesizedSalesPitch}&rdquo;
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={handleOpenSarah}
                        className="px-4 py-2 rounded-xl bg-white text-blue-700 font-extrabold text-xs hover:bg-blue-50 transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                      >
                        <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={sarahAvatarUrl}
                            alt="Sarah"
                            fill
                            sizes="16px"
                            unoptimized={true}
                            className="object-cover"
                          />
                        </div>
                        <span>Talk to Sarah &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Location & Commute Explorer (Hyper-Local Intelligence) */}
            <PropertyCommuteExplorer
              hyperLocal={knowledgeBase?.hyperLocal}
              propertyAddress={property.address}
              city={property.city || undefined}
            />

            {/* Verified Amenities & Unique Features */}
            {((property.amenities && property.amenities.length > 0) ||
              (property.features && property.features.length > 0)) && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Verified Amenities & Features
                  </h2>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    {(property.amenities?.length || 0) + (property.features?.length || 0)} Included
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...(property.amenities || []), ...(property.features || [])].map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Building Policies & FAQs */}
            <PropertyPoliciesFaqSection
              petPolicyDetail={knowledgeBase?.petPolicyDetail}
              parkingDetail={knowledgeBase?.parkingDetail}
              utilitiesDetail={knowledgeBase?.utilitiesDetail}
              washroomDetail={knowledgeBase?.washroomDetail}
              applicationProcess={knowledgeBase?.applicationProcess}
              faqs={knowledgeBase?.faqs}
            />
          </div>

          {/* Right Sidebar Column: Voice Concierge Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Voice Concierge Hero Card (Voice-First Prominence) */}
            <SarahVoiceConciergeCard
              onStartCall={handleOpenSarah}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {property.listingType === "rent" ? "Rent" : "Price"}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              ₹{Number(property.price).toLocaleString("en-IN")}
              {property.listingType === "rent" && <span className="text-xs font-normal text-slate-500">/mo</span>}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenSarah}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-white/40">
                <Image
                  src={sarahAvatarUrl}
                  alt="Sarah"
                  fill
                  sizes="20px"
                  unoptimized={true}
                  className="object-cover"
                />
              </div>
              <span>Talk to Sarah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share & QR Modal */}
      {isShareModalOpen && (
        <ShareListingModal
          qrCodeSvg={property.qrCodeSvg}
          whatsAppUrl={whatsAppUrl}
          copied={copied}
          onCopy={() => copyShareUrl(shareUrl)}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Public Listing Footer */}
      <PublicListingFooter />
    </div>
  );
}
