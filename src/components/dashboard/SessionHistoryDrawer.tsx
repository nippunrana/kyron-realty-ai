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
} from "lucide-react";
import type { SessionHistoryItem } from "./usage-types";

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistoryItem[];
}

export function SessionHistoryDrawer({
  isOpen,
  onClose,
  sessions,
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
      <div className="fixed inset-y-0 right-0 w-full sm:w-[580px] md:w-[640px] lg:w-[720px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-tight">
                  Voice Sessions & Credit Log
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
                onClick={() => setActiveFilter(tab.key as any)}
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

        {/* Session Log Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          <div className="col-span-5">Property / Draft</div>
          <div className="col-span-3">Call Type</div>
          <div className="col-span-2 text-right">Duration</div>
          <div className="col-span-2 text-right">Date</div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 sm:p-4 space-y-1">
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
              return (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800/80 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  {/* Col 1: Property / Draft */}
                  <div className="col-span-5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="font-semibold text-slate-100 truncate block max-w-full">
                        {sess.propertyTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase ${
                          sess.isDraft
                            ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                        }`}
                      >
                        {sess.isDraft ? "Draft" : "Published"}
                      </span>
                      {sess.mapsUsageSummary && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          <span>{sess.mapsUsageSummary}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Call Type */}
                  <div className="col-span-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        isOnboarding
                          ? "bg-purple-950/70 text-purple-300 border border-purple-800/40"
                          : "bg-blue-950/70 text-blue-300 border border-blue-800/40"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{isOnboarding ? "Owner Intake" : "Buyer Call"}</span>
                    </span>
                  </div>

                  {/* Col 3: Duration */}
                  <div className="col-span-2 text-right font-mono">
                    <span className="font-bold text-slate-100 block">
                      {sess.durationFormatted}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {sess.durationMinutes}m
                    </span>
                  </div>

                  {/* Col 4: Date */}
                  <div className="col-span-2 text-right">
                    <span className="text-[11px] text-slate-400 block whitespace-nowrap">
                      {sess.formattedDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>300 Min Free Tier • Zero out-of-pocket spend</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            Showing {filteredSessions.length} of {sessions.length} calls
          </span>
        </div>
      </div>
    </div>
  );
}
