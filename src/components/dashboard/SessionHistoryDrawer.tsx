"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  PhoneCall,
  MapPin,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Mic,
  Map,
  Navigation,
  Bot,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import type { SessionHistoryItem } from "./usage-types";
import { BASE_PATH } from "@/lib/base-path";

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistoryItem[];
  commercialMode?: boolean;
  totalCommercialSpendUsd?: number;
  totalCommercialSpendInr?: number;
}

export function SessionHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  commercialMode = false,
  totalCommercialSpendUsd = 0,
  totalCommercialSpendInr = 0,
}: SessionHistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ONBOARDING" | "BUYER" | "DRAFTS">("ALL");
  const [copied, setCopied] = useState(false);

  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      // Filter tab
      if (activeFilter === "ONBOARDING" && sess.callerType !== "owner_onboarding") return false;
      if (activeFilter === "BUYER" && sess.callerType !== "buyer_inquiry") return false;
      if (activeFilter === "DRAFTS" && !sess.isDraft) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sess.propertyTitle.toLowerCase().includes(q) ||
        sess.callerType.toLowerCase().includes(q) ||
        sess.formattedDate.toLowerCase().includes(q)
      );
    });
  }, [sessions, activeFilter, searchQuery]);

  // Cumulative spend across filtered sessions (commercial mode only)
  const filteredSpend = useMemo(() => {
    if (!commercialMode) return null;
    return filteredSessions.reduce(
      (acc, s) => {
        const b = s.costBreakdown;
        if (!b) return acc;
        acc.total += b.totalCostUsd;
        acc.totalInr += b.totalCostInr;
        return acc;
      },
      { total: 0, totalInr: 0 }
    );
  }, [filteredSessions, commercialMode]);

  const handleCopy = () => {
    try {
      const exportData = filteredSessions.map((s) => ({
        id: s.id,
        property: s.propertyTitle,
        isDraft: s.isDraft,
        type: s.callerType,
        duration: s.durationFormatted,
        durationMinutes: s.durationMinutes,
        mapsUsage: s.mapsUsageSummary,
        date: s.formattedDate,
        costUsd: s.costBreakdown?.totalCostUsd,
      }));
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to export sessions:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[620px] md:w-[680px] lg:w-[760px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-tight">
                  Voice Sessions &amp; Credit Log
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50 text-[10px] font-bold">
                  {sessions.length} recorded
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Summarized call duration, AI intelligence, and Maps consumption per session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
              title="Export session summaries"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Commercial Spend Summary Banner (only in commercial mode) */}
        {commercialMode && (
          <div className="px-4 sm:px-5 py-3 bg-orange-950/40 border-b border-orange-800/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider">
                  Cumulative Commercial Spend
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  All {sessions.length} sessions • Zero free tier applied
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-orange-300 font-mono tracking-tight">
                ${totalCommercialSpendUsd.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400">≈ ₹{totalCommercialSpendInr.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-3 sm:px-5 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { key: "ALL", label: "All Sessions" },
              { key: "ONBOARDING", label: "Owner Onboarding" },
              { key: "BUYER", label: "Buyer Calls" },
              { key: "DRAFTS", label: "Drafts Only" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key as "ALL" | "ONBOARDING" | "BUYER" | "DRAFTS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties or date..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Filtered spend bar when search is active in commercial mode */}
        {commercialMode && filteredSpend && filteredSessions.length !== sessions.length && (
          <div className="px-5 py-1.5 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Filtered: {filteredSessions.length} sessions
            </span>
            <span className="text-[11px] font-semibold text-orange-300 font-mono">
              ${filteredSpend.total.toFixed(2)} ≈ ₹{filteredSpend.totalInr.toFixed(2)}
            </span>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <PhoneCall className="w-8 h-8 stroke-[1.5] mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold">No voice sessions found</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                {searchQuery || activeFilter !== "ALL"
                  ? "Try clearing your search query or switching filters."
                  : "Onboard a property by voice or test your 24/7 sales agent to see call logs appear here."}
              </p>
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const isOnboarding = sess.callerType === "owner_onboarding";
              const b = sess.costBreakdown;
              const durationMinutes = Number(sess.durationMinutes);
              const groundingQueriesCount = sess.groundingQueries ?? 0;
              const routesElemCount = sess.routesElements ?? 0;

              return (
                <div
                  key={sess.id}
                  className="rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-4 transition-all duration-200 shadow-sm flex flex-col gap-3"
                >
                  {/* Card Header Row: Title & Status (Left), Date (Right) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sess.propertySlug && !sess.isDraft && !sess.isUnsavedIntake ? (
                          <a
                            href={`${BASE_PATH}/listings/${sess.propertySlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 group/link"
                            title={`Open ${sess.propertyTitle} in new tab`}
                          >
                            <span className="line-clamp-1">{sess.propertyTitle}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-blue-400 shrink-0 transition-colors" />
                          </a>
                        ) : (
                          <span className="font-bold text-sm text-slate-100 line-clamp-1">
                            {sess.propertyTitle}
                          </span>
                        )}
                        {sess.isUnsavedIntake ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700/80 shrink-0">
                            Unsaved Intake
                          </span>
                        ) : sess.isDraft ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/60 shrink-0">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shrink-0">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        {sess.formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Card Meta Row: Call Type, Maps summary, Duration & Agora Verification */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1 border-t border-slate-800/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Call Type */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isOnboarding
                            ? "bg-purple-900/40 text-purple-200 border border-purple-700/50"
                            : "bg-blue-900/40 text-blue-200 border border-blue-700/50"
                        }`}
                      >
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>{isOnboarding ? "Owner Intake" : "Buyer Call"}</span>
                      </span>

                      {/* Maps / Routes usage summary */}
                      {sess.mapsUsageSummary && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-200 bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-700/50">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{sess.mapsUsageSummary}</span>
                        </span>
                      )}
                    </div>

                    {/* Duration & Agora Badge */}
                    <div className="flex items-center gap-2 font-mono">
                      {sess.isAgoraVerified && (
                        <span
                          title="Duration verified by Agora Cloud Gateway"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-900/40 text-blue-300 border border-blue-700/50 text-[10px] font-sans font-semibold tracking-tight"
                        >
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          <span>Agora Verified</span>
                        </span>
                      )}
                      <span className="font-bold text-slate-100 text-xs">
                        {sess.durationFormatted}
                      </span>
                      <span className="text-[11px] text-slate-500 font-sans">
                        ({sess.durationMinutes}m)
                      </span>
                    </div>
                  </div>

                  {/* Telemetry & Cost Breakdown: Lighter surface, rich color, crisp typography */}
                  {b && (
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* 4 Telemetry Micro-Pills in a balanced grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                        {/* Voice chip */}
                        <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/25 border border-purple-400/40 text-purple-100 flex items-center gap-2 min-w-0 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                            <Mic className="w-3.5 h-3.5 text-purple-300" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] text-purple-200 font-semibold tracking-wide">Voice</p>
                            <p className="text-[11px] font-bold text-white font-mono truncate">
                              {commercialMode ? `$${b.voiceCostUsd.toFixed(3)}` : `$0.00`}
                              <span className="text-[9.5px] font-medium text-purple-200/90 ml-1">({durationMinutes.toFixed(1)}m)</span>
                            </p>
                          </div>
                        </div>

                        {/* Routes chip */}
                        <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/25 border border-amber-400/40 text-amber-100 flex items-center gap-2 min-w-0 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                            <Navigation className="w-3.5 h-3.5 text-amber-300" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] text-amber-200 font-semibold tracking-wide">Routes</p>
                            <p className="text-[11px] font-bold text-white font-mono truncate">
                              {commercialMode ? `$${b.routesCostUsd.toFixed(3)}` : `$0.00`}
                              <span className="text-[9.5px] font-medium text-amber-200/90 ml-1">({routesElemCount} elem)</span>
                            </p>
                          </div>
                        </div>

                        {/* Maps chip */}
                        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 flex items-center gap-2 min-w-0 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                            <Map className="w-3.5 h-3.5 text-emerald-300" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] text-emerald-200 font-semibold tracking-wide">Maps</p>
                            <p className="text-[11px] font-bold text-white font-mono truncate">
                              {commercialMode ? `$${b.mapsCostUsd.toFixed(3)}` : `$0.00`}
                              <span className="text-[9.5px] font-medium text-emerald-200/90 ml-1">({groundingQueriesCount} q)</span>
                            </p>
                          </div>
                        </div>

                        {/* AI Engine chip */}
                        <div className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/25 border border-indigo-400/40 text-indigo-100 flex items-center gap-2 min-w-0 transition-colors">
                          <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-indigo-300" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[10px] text-indigo-200 font-semibold tracking-wide">AI Engine</p>
                            <p className="text-[11px] font-bold text-white font-mono truncate">
                              {commercialMode ? `$${b.aiCostUsd.toFixed(4)}` : `$0.00`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Total Spend Badge */}
                      <div className="sm:border-l sm:border-slate-700/70 sm:pl-3 flex sm:flex-col justify-between items-end shrink-0 text-right">
                        <span className="text-[10px] uppercase font-semibold text-slate-300 tracking-wider">
                          {commercialMode ? "Total Spend" : "Free Tier"}
                        </span>
                        {commercialMode ? (
                          <div>
                            <p className="text-sm font-extrabold text-orange-300 font-mono leading-tight">
                              ${b.totalCostUsd.toFixed(3)}
                            </p>
                            <p className="text-[10px] text-slate-300 font-mono">
                              ≈ ₹{b.totalCostInr.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-extrabold text-emerald-400 font-mono leading-tight">
                              $0.00
                            </p>
                            <p className="text-[10px] text-slate-300 font-mono">
                              ${b.totalCostUsd.toFixed(3)} covered
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            {commercialMode ? (
              <>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Commercial Rates • Zero Free Tier</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>300 Min Free Tier • Zero out-of-pocket spend</span>
              </>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Showing {filteredSessions.length} of {sessions.length} calls
          </span>
        </div>
      </div>
    </div>
  );
}
