"use client";

import Link from "next/link";
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  PhoneCall,
  QrCode,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Car,
  Zap,
  Dog,
} from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { BASE_PATH, PUBLIC_ORIGIN } from "@/lib/base-path";
import { DEMO_LISTING, DEMO_LISTING_SLUG } from "@/lib/demo-listing";

interface DemoListingCardProps {
  onOpenCallModal: () => void;
}

export function DemoListingCard({ onOpenCallModal }: DemoListingCardProps) {
  const { copied: copiedLink, copy } = useCopyToClipboard();
  const listingUrl = `${PUBLIC_ORIGIN}${BASE_PATH}/listings/${DEMO_LISTING_SLUG}`;

  return (
    <section id="flagship-property" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>Live Demo Property & Distribution Kit</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Experience a Live Listing in Action
        </h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          See how physical yard signs and WhatsApp social links connect directly to our 24/7 Agora Voice Sales Agent.
        </p>
      </div>

      {/* Flagship Card Split */}
      <div className="luxury-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl shadow-slate-200/50 bg-white/95 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Property Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Image with Badges */}
              <div className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-16/10 bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={DEMO_LISTING.coverImageUrl}
                  alt="250 Marina Boulevard residence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-sm">
                    Verified Active Listing
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-600 text-white shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 24/7 Voice AI Ready
                  </span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black drop-shadow-sm">
                      250 Marina Boulevard
                    </h3>
                    <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Marina District, San Francisco, CA 94123</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black drop-shadow-sm">
                      ${Number(DEMO_LISTING.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-200 block">/ month</span>
                  </div>
                </div>
              </div>

              {/* Specs Row */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Bed className="w-4 h-4 text-blue-600" />
                    <span>Bedrooms</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">{DEMO_LISTING.bedrooms} Beds</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Bath className="w-4 h-4 text-blue-600" />
                    <span>Bathrooms</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">{DEMO_LISTING.bathrooms.toFixed(1)} Baths</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Maximize className="w-4 h-4 text-blue-600" />
                    <span>Living Area</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">{DEMO_LISTING.sqft.toLocaleString()} sqft</span>
                </div>
              </div>

              {/* Amenities Pills */}
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  <Dog className="w-3.5 h-3.5 text-slate-500" /> Pet Friendly (&lt;60 lbs)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-500" /> Reserved Garage Stall
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-slate-500" /> Level-2 EV Charger
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  In-unit Washer/Dryer
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenCallModal}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Voice Agent Now</span>
              </button>

              <Link
                href={`/listings/${DEMO_LISTING_SLUG}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all"
              >
                <span>View Full Listing Page</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Right Column: Physical & Digital Distribution Toolkit (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/90 h-full">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Distribution Toolkit
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  Print & Share Ready
                </span>
              </div>

              {/* Printable QR Code Preview */}
              <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200/80 flex items-center gap-4">
                <div className="w-24 h-24 p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                  {/* Vector SVG QR Representation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
                    <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10zM40 10h10v10H40zM55 10h10v10H55zM40 25h10v10H40zM55 25h10v10H55zM40 40h20v10H40zM10 40h20v10H10zM70 40h20v10H70zM40 70h10v10H40zM55 70h10v10H55zM70 70h10v10H70zM85 70h10v10H85zM40 85h25v10H40zM75 85h20v10H75z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Yard Sign & Flyer QR Code</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Print directly on yard signs. Callers scan with their camera to instantly speak with Sarah without downloading an app.
                  </p>
                </div>
              </div>

              {/* WhatsApp Share Card Preview */}
              <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Deep Link Preview</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(listingUrl)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-slate-700 leading-relaxed">
                  &quot;🏡 Just Listed: 250 Marina Boulevard, SF! 2 Bed | 2 Bath | $3,450/mo. Tap here to view photos & speak directly with our 24/7 Voice AI Agent for instant tour booking: <span className="text-blue-600 underline">egnitech.com/marina-loft</span>&quot;
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero app install required for callers</span>
              </span>
              <span className="font-semibold text-slate-700">Sub-300ms WebRTC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
