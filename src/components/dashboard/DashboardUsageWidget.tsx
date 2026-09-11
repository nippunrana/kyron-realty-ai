"use client";

import { useState, useSyncExternalStore } from "react";
import {
  PhoneCall,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  History,
  Navigation,
  Bot,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { DashboardUsageStats, SessionHistoryItem } from "./usage-types";
import { SessionHistoryDrawer } from "./SessionHistoryDrawer";

interface DashboardUsageWidgetProps {
  stats: DashboardUsageStats;
  sessions: SessionHistoryItem[];
}

const PREF_KEY = "kyron_cost_mode_pref";
let prefListeners: Array<() => void> = [];

function subscribePref(callback: () => void) {
  prefListeners.push(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    prefListeners = prefListeners.filter((l) => l !== callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function getPrefSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREF_KEY) === "commercial";
  } catch {
    return false;
  }
}

function getPrefServerSnapshot(): boolean {
  return false;
}

function setPrefStore(commercial: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, commercial ? "commercial" : "free");
  } catch {}
  prefListeners.forEach((l) => l());
}

export function DashboardUsageWidget({ stats, sessions }: DashboardUsageWidgetProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const commercialMode = useSyncExternalStore(
    subscribePref,
    getPrefSnapshot,
    getPrefServerSnapshot,
  );

  const handleToggle = () => {
    setPrefStore(!getPrefSnapshot());
  };

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
              <span>AI Credit &amp; Telemetry Usage</span>
              {commercialMode ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Raw Commercial Cost
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Free Tier Active
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Live consumption tracking across Agora Voice AI, Google Routes, and Gemini Maps Grounding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Free Tier Toggle */}
          <button
            type="button"
            id="cost-mode-toggle"
            onClick={handleToggle}
            title={commercialMode ? "Switch to Free Tier view" : "Show raw commercial cost (no free tier)"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              commercialMode
                ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {commercialMode ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span>{commercialMode ? "Free Tier Off" : "Free Tier On"}</span>
          </button>

          {/* View Session History Button */}
          <button
            type="button"
            id="view-session-history-btn"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-xs hover:border-slate-300 transition-all text-xs font-semibold cursor-pointer group"
          >
            <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            <span>View Session History</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 text-[10px] font-bold border border-slate-200/80 transition-colors">
              {sessions.length}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
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

            {commercialMode ? (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                    ${stats.voiceSpendUsd.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    voice spend
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ≈ ₹{(stats.voiceSpendUsd * 86).toFixed(2)} • {stats.totalConvoMinutes} min used
                </p>
                {/* Mini Progress Bar */}
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(stats.convoPercentage, 2))}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-1.5 flex-wrap">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                      {stats.convoMinutesFormatted}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      / {stats.convoFreeTierLimit} min
                    </span>
                  </div>
                  {stats.totalConvoMinutes <= stats.convoFreeTierLimit ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{stats.convoMinutesRemaining} min left in trial</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>+{stats.convoOverageMinutes} min post-trial ($0.10/min)</span>
                    </span>
                  )}
                </div>
                {/* Mini Progress Bar */}
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.totalConvoMinutes > stats.convoFreeTierLimit ? "bg-amber-500" : "bg-purple-600"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(stats.convoPercentage, 2))}%` }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Agora SD-RTN Synced</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100 text-[10px]">
              {commercialMode ? "Raw Rate ($0.10/min)" : stats.totalConvoMinutes > stats.convoFreeTierLimit ? "$0.10/min billed" : "300 min/mo free"}
            </span>
          </div>
        </div>

        {/* Card 2: Google Maps & Routes */}
        <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 bg-white/90 hover:border-amber-200/80 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Maps &amp; Routes Matrix
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
            </div>

            {commercialMode ? (
              <>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                    ${(stats.routesSpendUsd + stats.mapsSpendUsd).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">combined</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ≈ ₹{((stats.routesSpendUsd + stats.mapsSpendUsd) * 86).toFixed(2)} • Routes + Maps Grounding
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span>Routes: ${stats.routesSpendUsd.toFixed(3)}</span>
                  <span className="text-slate-300">•</span>
                  <span>Maps: ${stats.mapsSpendUsd.toFixed(3)}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">70k Routes • 5k Maps</span>
            <span className={`px-1.5 py-0.5 rounded font-semibold border text-[10px] ${
              commercialMode
                ? "bg-orange-50 text-orange-700 border-orange-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}>
              {commercialMode ? "Actual Cost" : "Free Tier"}
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
                Spend &amp; Credit Status
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {commercialMode ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                    ${stats.totalCommercialSpendUsd.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    total cost
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ≈ ₹{stats.totalCommercialSpendInr.toFixed(2)} across all services
                </p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">
                    Zero Free Tier Applied
                  </span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {commercialMode ? "Actual commercial rates" : "No overage charges"}
            </span>
            <span className={`px-1.5 py-0.5 rounded font-semibold border text-[10px] ${
              commercialMode
                ? "bg-orange-50 text-orange-700 border-orange-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}>
              {commercialMode ? "Actual Cost (Zero Free Tier)" : "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer */}
      <SessionHistoryDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
        commercialMode={commercialMode}
        totalCommercialSpendUsd={stats.totalCommercialSpendUsd}
        totalCommercialSpendInr={stats.totalCommercialSpendInr}
      />
    </section>
  );
}
