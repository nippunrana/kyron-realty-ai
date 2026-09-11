"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  PhoneCall,
  QrCode,
  Share2,
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Camera,
  BadgeCheck,
} from "lucide-react";
import { VoiceSalesAgentModal } from "@/components/voice/VoiceSalesAgentModal";
import { TourBookingForm } from "./TourBookingForm";
import { ShareListingModal } from "./ShareListingModal";
import { TourBookingModal } from "./TourBookingModal";
import { PropertySpecsBento } from "./PropertySpecsBento";
import { PropertyCommuteExplorer } from "./PropertyCommuteExplorer";
import { PropertyPoliciesFaqSection } from "./PropertyPoliciesFaqSection";
import { SarahVoiceConciergeCard } from "./SarahVoiceConciergeCard";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { defaultTourDateTime } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";
import { formatPropertyTypeLabel } from "@/lib/property-types";

interface PublicProperty {
  id: number;
  slug: string;
  status: string;
  title: string;
  description: string | null;
  address: string;
  unitNumber?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  listingType: string;
  propertyType: string;
  price: string;
  securityDeposit?: string | null;
  minLeaseMonths?: number | null;
  hoaFeeMonthly?: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  sqft: number | null;
  floorNumber?: number | null;
  storeys?: number | null;
  rentScope?: string | null;
  washrooms?: number | null;
  furnishingStatus?: string | null;
  yearBuilt?: number | null;
  availableDate: string | Date | null;
  coverImageUrl?: string | null;
  images?: string[] | null;
  amenities?: string[] | null;
  features?: string[] | null;
  qrCodeSvg?: string | null;
}

interface PublicKnowledgeBase {
  synthesizedSalesPitch?: string | null;
  neighborhoodSummary?: string | null;
  schoolDistrictInfo?: string | null;
  petPolicyDetail?: string | null;
  parkingDetail?: string | null;
  utilitiesDetail?: string | null;
  washroomDetail?: string | null;
  applicationProcess?: string | null;
  faqs?: Array<{ question: string; answer: string; category: string }>;
  hyperLocal?: any;
}

interface PublicListingClientProps {
  property: PublicProperty;
  knowledgeBase: PublicKnowledgeBase;
  media: Array<{ id: number; url: string; mediaType?: string }>;
  shareUrl: string;
}

export function PublicListingClient({
  property,
  knowledgeBase,
  media,
  shareUrl,
}: PublicListingClientProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});
  const { copied, copy: copyShareUrl } = useCopyToClipboard();

  // Tour Booking Form State
  const [bookName, setBookName] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookDate, setBookDate] = useState(() => defaultTourDateTime(14));
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  const handleDirectTourBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);

    try {
      const res = await fetch(`${BASE_PATH}/api/leads/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug: property.slug,
          name: bookName,
          phone: bookPhone,
          scheduledStart: bookDate,
          tourType: "in_person",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setIsBookingModalOpen(false);
          setBookingSuccess(false);
        }, 2500);
      }
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const locationSummary = [property.city, property.state].filter(Boolean).join(", ") || property.address || "";
  const whatsAppText = encodeURIComponent(
    `🏡 Check out this property: ${property.title}${locationSummary ? ` in ${locationSummary}` : ""}!\n` +
    `Price: ₹${Number(property.price).toLocaleString("en-IN")}${property.listingType === "rent" ? "/mo" : ""}\n\n` +
    `Talk with our 24/7 AI Voice Agent for instant answers & tour booking:\n${shareUrl}`
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
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[140px] sm:max-w-xs">
              {locationSummary}
            </span>
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
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Talk to Voice Agent</span>
              <span className="sm:hidden">Talk Voice</span>
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
                  onError={() => setFailedImageUrls((prev) => ({ ...prev, [currentHeroImage]: true }))}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

              {/* Floating Top Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                  {property.listingType === "rent" ? "For Rent" : "For Sale"}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {formatPropertyTypeLabel(property.propertyType)}
                </span>
              </div>

              {/* Top-Right Voice Status Pill */}
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/95 hover:bg-blue-600 active:bg-blue-700 backdrop-blur-md text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-transform hover:scale-103 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24/7 AI Voice Concierge</span>
                </button>
              </div>

              {/* Bottom Image Overlay: Title & Address */}
              <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 text-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">
                    {[
                      property.address,
                      property.unitNumber ? `Unit ${property.unitNumber}` : null,
                      [property.city, property.state].filter(Boolean).join(", "),
                      property.zipCode,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight">
                  {property.title}
                </h1>
              </div>
            </div>

            {/* Thumbnail Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {images.slice(0, 3).map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative flex-1 min-w-[140px] lg:min-w-0 aspect-16/10 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
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
          {/* Left Column: Specs, Voice Pitch, About, Amenities, Commute Map, Policies & FAQs (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Primary Price & Conversion Action Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs">
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

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <PhoneCall className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Talk with Sarah (Voice AI)</span>
                  </button>

                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Tour</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Key Specifications Bento */}
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
                        onClick={() => setIsVoiceModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white text-blue-700 font-extrabold text-xs hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Ask Sarah Live Questions &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About this Property & Narrative */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                About this Property
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>

              {knowledgeBase?.neighborhoodSummary && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Neighborhood Highlights
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{knowledgeBase.neighborhoodSummary}&rdquo;
                  </p>
                </div>
              )}
            </div>

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

            {/* Interactive Location & Commute Explorer */}
            <PropertyCommuteExplorer
              hyperLocal={knowledgeBase?.hyperLocal}
              propertyAddress={property.address}
              city={property.city || undefined}
            />

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

          {/* Right Sidebar Column: Voice Concierge Card & Tour Booking (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Voice Concierge Hero Card (Voice-First Prominence) */}
            <SarahVoiceConciergeCard
              onStartCall={() => setIsVoiceModalOpen(true)}
              propertyTitle={property.title}
            />

            {/* In-Person / Video Tour Booking Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>Schedule a Walkthrough</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Private In-Person Tour
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tour this property with our property manager or via scheduled walkthrough.
              </p>

              <TourBookingForm
                name={bookName}
                phone={bookPhone}
                date={bookDate}
                onNameChange={setBookName}
                onPhoneChange={setBookPhone}
                onDateChange={setBookDate}
                onSubmit={handleDirectTourBooking}
                isSubmitting={isSubmittingBooking}
                success={bookingSuccess}
                successTitle="Your Viewing Request is Confirmed!"
                submitLabel="Confirm Viewing Appointment"
                busyLabel="Booking Tour..."
              />

              {/* FUD Shield */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero fees • Instant automated confirmation</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {property.title}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              ₹{Number(property.price).toLocaleString("en-IN")}
              {property.listingType === "rent" ? "/mo" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Viewing</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Talk with Sarah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Sales Agent Modal */}
      {isVoiceModalOpen && (
        <VoiceSalesAgentModal
          onClose={() => setIsVoiceModalOpen(false)}
          property={{
            id: property.id,
            title: property.title,
            slug: property.slug,
            price: property.price,
            listingType: property.listingType,
            address: property.address,
            city: property.city || undefined,
            coverImageUrl: currentHeroImage,
          }}
        />
      )}

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

      {/* Tour Booking Modal */}
      {isBookingModalOpen && (
        <TourBookingModal propertyTitle={property.title} onClose={() => setIsBookingModalOpen(false)}>
          <TourBookingForm
            name={bookName}
            phone={bookPhone}
            date={bookDate}
            onNameChange={setBookName}
            onPhoneChange={setBookPhone}
            onDateChange={setBookDate}
            onSubmit={handleDirectTourBooking}
            isSubmitting={isSubmittingBooking}
            success={bookingSuccess}
            successTitle="Viewing Confirmed!"
            successNote="We will reach out to confirm your visit."
            submitLabel="Submit Viewing Request"
            busyLabel="Booking..."
          />
        </TourBookingModal>
      )}
    </div>
  );
}
