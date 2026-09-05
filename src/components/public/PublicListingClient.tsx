"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  PhoneCall,
  QrCode,
  Share2,
  Calendar,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Car,
  PawPrint,
  Zap,
  HelpCircle,
  Clock,
  X,
  Copy,
  Check,
} from "lucide-react";
import { VoiceSalesAgentModal } from "@/components/voice/VoiceSalesAgentModal";
import { defaultTourDateTime } from "@/lib/listing-helpers";
import { BASE_PATH } from "@/lib/base-path";

interface PublicListingClientProps {
  property: any;
  knowledgeBase: any;
  media: any[];
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
  const [copied, setCopied] = useState(false);

  // Booking Form State
  const [bookName, setBookName] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Computed after mount so the server-rendered markup never carries a timezone-dependent value
  useEffect(() => {
    setBookDate(defaultTourDateTime(14));
  }, []);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Could not copy:", e);
    }
  };

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
    `Price: $${Number(property.price).toLocaleString()}${property.listingType === "rent" ? "/mo" : ""}\n\n` +
    `Talk with our 24/7 AI Voice Agent for instant answers & tour booking:\n${shareUrl}`
  );
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${whatsAppText}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-28">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-900 group"
            >
              <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold tracking-tight text-sm sm:text-base">
                Kyron Realty
              </span>
            </Link>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[140px] sm:max-w-xs">
              {[property.city, property.state].filter(Boolean).join(", ") || property.address}
            </span>
          </div>

          <div className="flex items-center gap-2">
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

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Photo Gallery Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Primary Hero Image (8 cols) */}
            <div className="lg:col-span-8 relative aspect-16/10 rounded-3xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentHeroImage}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/15 pointer-events-none" />

              {/* Floating Top Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                  {property.listingType === "rent" ? "For Rent" : "For Sale"}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                  {property.propertyType}
                </span>
              </div>

              {/* Live Voice Badge */}
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>24/7 AI Voice Concierge</span>
                </div>
              </div>

              {/* Bottom Image Title */}
              <div className="absolute bottom-4 inset-x-4 text-white">
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
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2-Column Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Main Column: Specs, Description, Knowledge (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Primary Specs Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    {property.listingType === "rent" ? "Monthly Lease Price" : "Asking Price"}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                    ${Number(property.price).toLocaleString()}
                    {property.listingType === "rent" && (
                      <span className="text-base font-normal text-slate-500"> / month</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Talk with Voice Agent</span>
                  </button>

                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Tour</span>
                  </button>
                </div>
              </div>

              {/* 4-Pillar Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Bedrooms
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {property.bedrooms || 2} Beds
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Bathrooms
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {property.bathrooms || 2.0} Baths
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Square Feet
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {property.sqft || 1100} sqft
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Availability
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      Immediate
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Voice Elevator Pitch Feature Callout */}
            {knowledgeBase?.synthesizedSalesPitch && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                    🎙️
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI Leasing Advisor Preview</span>
                    </div>
                    <p className="text-sm sm:text-base font-medium leading-relaxed italic">
                      "{knowledgeBase.synthesizedSalesPitch}"
                    </p>
                    <div className="mt-4 flex items-center gap-3">
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

            {/* Property Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-3">
                About this Property
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-4 flex items-center justify-between">
                <span>Verified Amenities & Features</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {property.amenities?.length || 0} Included
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(property.amenities || []).map((amenity: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified FAQs Accordion */}
            {knowledgeBase?.faqs && knowledgeBase.faqs.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span>Frequently Asked Questions</span>
                </h2>

                <div className="space-y-3">
                  {knowledgeBase.faqs.map((faq: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {faq.category}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                        Q: {faq.question}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed">
                        A: {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column: Tour Booking, Neighborhood, Agent Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Tour Booking Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs sticky top-24">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                <Calendar className="w-4 h-4" />
                <span>Schedule a Walkthrough</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                Private In-Person Tour
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tour this property with our property manager or via live video walkthrough.
              </p>

              {bookingSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  <span>Your Viewing Request is Confirmed!</span>
                </div>
              ) : (
                <form onSubmit={handleDirectTourBooking} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(415) 555-0199"
                      value={bookPhone}
                      onChange={(e) => setBookPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Preferred Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    {isSubmittingBooking ? "Booking Tour..." : "Confirm Viewing Appointment"}
                  </button>
                </form>
              )}

              {/* FUD Shield */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero fees • Instant automated confirmation</span>
              </div>
            </div>

            {/* Verified Policies Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">
                Building & Lease Policies
              </h3>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <PawPrint className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pet Policy</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {knowledgeBase?.petPolicyDetail || "Cats & small dogs permitted with deposit."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Parking</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {knowledgeBase?.parkingDetail || "1 reserved garage stall included."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Included Utilities</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {knowledgeBase?.utilitiesDetail || "Water, trash, and sewer covered."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Sticky Action Bar (Mobile & Desktop Conversion Launcher) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {property.title}
            </span>
            <span className="text-base font-extrabold text-slate-900">
              ${Number(property.price).toLocaleString()}
              {property.listingType === "rent" ? "/mo" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
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
              <span>Talk with AI Voice Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Sales Agent Modal */}
      {isVoiceModalOpen && (
        <VoiceSalesAgentModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          property={{
            id: property.id,
            title: property.title,
            slug: property.slug,
            price: property.price,
            listingType: property.listingType,
            address: property.address,
            city: property.city,
            coverImageUrl: currentHeroImage,
          }}
        />
      )}

      {/* Share / QR Code Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center relative">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Share Property Listing
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Scan QR code on mobile or share via WhatsApp
            </p>

            {property.qrCodeSvg && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex items-center justify-center">
                <div
                  className="w-40 h-40 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: property.qrCodeSvg }}
                />
              </div>
            )}

            <div className="space-y-2">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share to WhatsApp</span>
              </a>

              <button
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied!" : "Copy Public Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Tour Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Book a Private Tour
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {property.title}
              </p>
            </div>

            {bookingSuccess ? (
              <div className="py-6 text-center text-emerald-700">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <span className="font-bold text-sm block">Viewing Confirmed!</span>
                <span className="text-xs text-slate-500">We will reach out to confirm your visit.</span>
              </div>
            ) : (
              <form onSubmit={handleDirectTourBooking} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="(415) 555-0199"
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {isSubmittingBooking ? "Booking..." : "Submit Viewing Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
