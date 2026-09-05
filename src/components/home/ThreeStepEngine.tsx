"use client";

import Link from "next/link";
import {
  Globe,
  QrCode,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";

export function ThreeStepEngine() {
  const steps = [
    {
      step: "01",
      title: "60-Sec Onboarding Studio",
      subtitle: "Paste any URL or talk to the ingest bot",
      description:
        "Paste a listing URL from Zillow, Redfin, or your broker portal. Apify web crawlers extract photos, specs, and policies, while our AI synthesizes a deep Knowledge Base and Landlord Guardrail Matrix in under a minute.",
      badge: "Apify Crawler + AI Synthesis",
      icon: Globe,
      features: [
        "Instant web scraper extracts all listing data",
        "Auto-synthesized FAQ & amenity guardrails",
        "Set target rent & hard floor pricing bounds",
      ],
      linkText: "Try Studio Wizard",
      linkHref: "/dashboard/properties/new",
    },
    {
      step: "02",
      title: "Instant Yard Sign & QR Toolkit",
      subtitle: "Physical printables & WhatsApp cards",
      description:
        "Every listing instantly receives a printable high-resolution vector QR code optimized for 'For Rent / For Sale' yard signs, brochures, and window flyers, plus one-tap WhatsApp cards with rich OpenGraph previews.",
      badge: "Automated Marketing Kit",
      icon: QrCode,
      features: [
        "Vector SVG printable for physical yard signs",
        "Instant 1-tap WhatsApp promotional card",
        "Dedicated public listing URL (/listings/[slug])",
      ],
      linkText: "Preview Yard Sign QR",
      linkHref: "#flagship-property",
    },
    {
      step: "03",
      title: "24/7 Agora Voice Associate",
      subtitle: "<300ms speech-to-speech sales dialogue",
      description:
        "When buyers scan your yard sign, Sarah answers in <300ms. She conducts natural, non-scripted sales conversations, handles mid-sentence interruptions, defends your floor price with Give-Get trades, and books tours.",
      badge: "Agora SD-RTN + Conversational AI",
      icon: PhoneCall,
      features: [
        "Ultra-low latency sub-300ms speech-to-speech",
        "Adaptive Exchange-of-Value negotiation",
        "Direct calendar booking & human handoff HUD",
      ],
      linkText: "Test Live Voice Agent",
      linkHref: "#hero-simulator",
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section Eyebrow & Title */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>The Autonomous Workflow</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          From Listing URL to 24/7 Voice Sales Agent in 3 Steps
        </h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Zero complex setups or month-long onboarding. Launch an intelligent voice associate for any property before your morning coffee gets cold.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="luxury-card luxury-card-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-slate-200/90 relative group"
            >
              {/* Step Pill */}
              <div className="flex items-center justify-between mb-6">
                <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-black text-sm flex items-center justify-center shadow-xs">
                  {item.step}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700">
                  {item.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="flex-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-blue-600 mt-1">
                  {item.subtitle}
                </p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                {/* Micro Features */}
                <ul className="mt-5 space-y-2 text-xs text-slate-700">
                  {item.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Link */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <Link
                  href={item.linkHref}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>{item.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
