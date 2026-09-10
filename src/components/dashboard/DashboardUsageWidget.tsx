"use client";

import { useState } from "react";
import {
  PhoneCall,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  History,
  Navigation,
  Bot,
} from "lucide-react";
import type { DashboardUsageStats, SessionHistoryItem } from "./usage-types";
import { SessionHistoryDrawer } from "./SessionHistoryDrawer";

interface DashboardUsageWidgetProps {
  stats: DashboardUsageStats;
  sessions: SessionHistoryItem[];
}

export function DashboardUsageWidget({ stats, sessions }: DashboardUsageWidgetProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <section className="mb-8">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>AI Credit & Telemetry Usage</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Free Tier Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Live consumption tracking across Agora Voice AI, Google Routes, and Gemini Maps Grounding
            </p>
          </div>
        </div>

        {/* View Session History Button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-xs font-semibold cursor-pointer group shrink-0"
        >
          <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
          <span>View Session History</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 text-[10px] font-bold border border-slate-200/80 transition-colors">
            {sessions.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Usage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Conversational AI Minutes */}
        <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90 hover:border-purple-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Conversational AI
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.convoMinutesFormatted}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {stats.convoFreeTierLimit} min
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(stats.convoPercentage, 2)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">300 min/mo free</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100 text-[10px]">
              $0.10/min post-tier
            </span>
          </div>
        </div>

        {/* Card 2: Google Maps & Routes */}
        <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90 hover:border-amber-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Maps & Routes Matrix
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {stats.totalRoutesElements}
                </span>
                <span className="text-xs text-slate-500 font-medium">elem</span>
              </div>
              <span className="text-slate-300 font-light">•</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {stats.totalGroundingQueries}
                </span>
                <span className="text-xs text-slate-500 font-medium">queries</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 line-clamp-1">
              {stats.totalRoutesElements > 0 || stats.totalGroundingQueries > 0
                ? `${stats.publishedCount + stats.draftsCount} properties enriched`
                : "Awaiting first property onboarding"}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">70k Routes • 5k Maps</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-100 text-[10px]">
              Free Tier
            </span>
          </div>
        </div>

        {/* Card 3: Voice Sessions Breakdown */}
        <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90 hover:border-blue-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Voice Sessions
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalVoiceSessions}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                total calls logged
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                {stats.onboardingSessionsCount} Onboarding
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {stats.buyerSessionsCount} Buyer Calls
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {stats.draftsCount} Drafts • {stats.publishedCount} Active
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              View Log &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Net Spend & Credit Status */}
        <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90 hover:border-emerald-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Spend & Credit Status
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                ${stats.estimatedSpendUsd.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                incurred spend
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">
                100% Free Tier Covered
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">No overage charges</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 text-[10px]">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <SessionHistoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
      />
    </section>
  );
}
