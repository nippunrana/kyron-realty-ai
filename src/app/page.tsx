"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Building2, Mic } from "lucide-react";
import { HeroVoiceSimulator } from "@/components/home/HeroVoiceSimulator";
import { QuickListingSearchBar } from "@/components/home/QuickListingSearchBar";
import { MissedCallCost } from "@/components/home/MissedCallCost";
import { WhoItIsFor } from "@/components/home/WhoItIsFor";
import { ThreeStepEngine } from "@/components/home/ThreeStepEngine";
import { NegotiationSimulator } from "@/components/home/NegotiationSimulator";
import { LiveHumanHandoff } from "@/components/home/LiveHumanHandoff";
import { DemoListingCard } from "@/components/home/DemoListingCard";
import { ObjectionsFaq } from "@/components/home/ObjectionsFaq";
import { ClosingCallToAction } from "@/components/home/ClosingCallToAction";
import { VoiceSalesAgentModal } from "@/components/voice/VoiceSalesAgentModal";
import { DEMO_LISTING } from "@/lib/demo-listing";

/**
 * Landing page narrative: promise → the cost of silence → who it is for → how a listing is made
 * → proof it protects your price → proof it hands over to a human → a finished listing →
 * objections → the ask. Sections are ordered as a funnel; reordering them breaks the argument.
 */

const NAV_LINKS = [
  { href: "#the-problem", label: "The problem" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#live-human", label: "Human handover" },
  { href: "/listings", label: "Listings" },
];

export default function Home() {
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);
  const { status } = useSession();

  // Sarah already lives in the root layout, so "talk to her" just opens the pod she is in
  const openFloatingAgent = () => {
    window.dispatchEvent(new CustomEvent("open-sales-agent"));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative overflow-x-hidden">
      {/* Ambient wash behind the fold */}
      <div className="absolute top-0 inset-x-0 h-[650px] luxury-gradient pointer-events-none -z-10" />

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900">Kyron Realty</span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            {NAV_LINKS.map((link) =>
              link.href.startsWith("#") ? (
                <a key={link.href} href={link.href} className="hover:text-blue-600 transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/listings"
              className="md:hidden inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Listings
            </Link>

            <button
              type="button"
              onClick={openFloatingAgent}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              <span>Talk to Sarah</span>
            </button>

            {status === "loading" ? (
              <div aria-hidden="true" className="h-8 w-24 rounded-xl bg-slate-200/60 animate-pulse" />
            ) : status === "authenticated" ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-xs transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-xs transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Funnel ---------------- */}
      <main className="flex-1 flex flex-col items-center">
        {/* 1. The promise, proved by a replayed call */}
        <HeroVoiceSimulator
          onTalkToSarah={openFloatingAgent}
          onOpenCallModal={() => setIsCallModalOpen(true)}
        />

        {/* Buyer shortcut into live inventory */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <QuickListingSearchBar />
        </div>

        {/* 2. Pain: what silence costs */}
        <MissedCallCost />

        {/* 3. Who this is actually for */}
        <WhoItIsFor />

        {/* 4. How a listing gets made without a form */}
        <ThreeStepEngine />

        {/* 5. Proof it defends your price */}
        <NegotiationSimulator />

        {/* 6. Proof it hands over to a human */}
        <LiveHumanHandoff />

        {/* 7. A finished listing to inspect */}
        <DemoListingCard onOpenCallModal={() => setIsCallModalOpen(true)} />

        {/* 8. Objections, answered before the ask */}
        <ObjectionsFaq />

        {/* 9. The ask */}
        <ClosingCallToAction onOpenCallModal={openFloatingAgent} />
      </main>

      {/* Property-scoped call for the demo residence */}
      {isCallModalOpen && (
        <VoiceSalesAgentModal
          onClose={() => setIsCallModalOpen(false)}
          property={DEMO_LISTING}
        />
      )}

      {/* ---------------- Footer ---------------- */}
      <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">Kyron Realty AI</span>
            <span>— properties that list themselves and answer their own calls.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/listings" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Explore all listings
            </Link>
            <Link href="/privacy" className="hover:text-blue-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-700 transition-colors">
              Terms of Service
            </Link>
            <span className="text-slate-400">Real-time voice on Agora SD-RTN</span>
            <span>&copy; {new Date().getFullYear()} Kyron Realty AI.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
