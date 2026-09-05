"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  PhoneCall,
  Radio,
} from "lucide-react";
import { HeroVoiceSimulator } from "@/components/home/HeroVoiceSimulator";
import { SpeedToLeadComparison } from "@/components/home/SpeedToLeadComparison";
import { ThreeStepEngine } from "@/components/home/ThreeStepEngine";
import { NegotiationSimulator } from "@/components/home/NegotiationSimulator";
import { DemoListingCard } from "@/components/home/DemoListingCard";
import { AgencyMetricsAndWaitlist } from "@/components/home/AgencyMetricsAndWaitlist";
import { VoiceSalesAgentModal } from "@/components/voice/VoiceSalesAgentModal";
import { DEMO_LISTING } from "@/lib/demo-listing";

export default function Home() {
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative overflow-x-hidden">
      {/* Subtle Luxury Ambient Radial Glow */}
      <div className="absolute top-0 inset-x-0 h-[650px] luxury-gradient pointer-events-none -z-10" />

      {/* Header & Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900">
                Kyron Realty
              </span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                AI
              </span>
            </div>
          </Link>

          {/* Nav Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#speed-to-lead" className="hover:text-blue-600 transition-colors">
              Speed-to-Lead
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Workflow
            </a>
            <a href="#negotiation-engine" className="hover:text-blue-600 transition-colors">
              Negotiation Engine
            </a>
            <a href="#flagship-property" className="hover:text-blue-600 transition-colors">
              Live Property
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              <span>Test Call</span>
            </button>

            <Link
              href="/login"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard/properties/new"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-xs transition-all"
            >
              Launch Studio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1 flex flex-col items-center">
        {/* 1. Hero & Interactive Voice Simulator */}
        <HeroVoiceSimulator onOpenCallModal={() => setIsCallModalOpen(true)} />

        {/* 2. Speed-to-Lead Comparison */}
        <SpeedToLeadComparison />

        {/* 3. 3-Step Autonomous Engine */}
        <ThreeStepEngine />

        {/* 4. Interactive Concession Negotiation Simulator */}
        <NegotiationSimulator />

        {/* 5. Flagship Demo Listing & Physical Yard Sign Showcase */}
        <DemoListingCard onOpenCallModal={() => setIsCallModalOpen(true)} />

        {/* 6. Agency ROI & Priority Pilot Waitlist */}
        <AgencyMetricsAndWaitlist />
      </main>

      {/* Live Voice Sales Modal for Agora Calls */}
      {isCallModalOpen && (
        <VoiceSalesAgentModal
          onClose={() => setIsCallModalOpen(false)}
          property={DEMO_LISTING}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">Kyron Realty AI</span>
            <span>— 24/7 Autonomous Voice AI for High-Ticket Real Estate & Flat Leasing.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Radio className="w-3 h-3 text-emerald-600" />
              Agora SD-RTN Conversational AI
            </span>
            <span>&copy; {new Date().getFullYear()} Kyron Realty AI.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
