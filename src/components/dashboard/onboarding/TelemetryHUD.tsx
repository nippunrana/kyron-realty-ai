"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  Terminal,
  Copy,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Check,
  Coins,
  Cpu,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

export interface TelemetryLogEvent {
  id: string;
  timestamp: string; // HH:mm:ss.SSS
  category:
    | "AGORA"
    | "INTENT"
    | "SYNC-GATE"
    | "EXTRACT-REQ"
    | "EXTRACT-RES"
    | "STATE-UPDATE"
    | "MODAL-TRIGGER"
    | "DISCONNECT-SYNTHESIS"
    | "ERROR";
  title: string;
  details?: any;
  latencyMs?: number;
  level?: "info" | "warn" | "error" | "success";
}

interface TelemetryHUDProps {
  isOpen: boolean;
  onClose: () => void;
  logs: TelemetryLogEvent[];
  onClearLogs: () => void;
  syncStatus: {
    isTurnSyncing: boolean;
    pendingFinalModalOpen: boolean;
    onboardingStage: string;
    availableDate?: string;
    sessionUsage?: {
      promptTokens?: number;
      candidateTokens?: number;
      totalTokens: number;
      totalCostUsd: number;
    };
  };
}

function formatStageName(stage: string): string {
  switch (stage) {
    case "core":
      return "Core Specs";
    case "additional_specs":
      return "Extra Specs";
    case "final_review":
      return "Final Review";
    case "complete":
      return "Complete";
    default:
      return stage ? stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Core Specs";
  }
}

export function TelemetryHUD({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  syncStatus,
}: TelemetryHUDProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const promptTokens = syncStatus.sessionUsage?.promptTokens ?? 0;
  const candidateTokens = syncStatus.sessionUsage?.candidateTokens ?? 0;
  const totalTokens = syncStatus.sessionUsage?.totalTokens ?? 0;
  const totalCostUsd = syncStatus.sessionUsage?.totalCostUsd ?? 0;
  const formattedCost =
    totalCostUsd > 0
      ? totalCostUsd < 0.01
        ? `$${totalCostUsd.toFixed(5)}`
        : `$${totalCostUsd.toFixed(4)}`
      : "$0.0000";

  const filteredLogs = useMemo(() => {
    if (selectedCategory === "ALL") return logs;
    return logs.filter((l) => l.category === selectedCategory);
  }, [logs, selectedCategory]);

  const handleCopyLogs = () => {
    try {
      const formatted = JSON.stringify(logs, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy logs:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="telemetry-hud-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] md:w-[600px] lg:w-[640px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200"
    >
      {/* HUD Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight font-sans">
                Pipeline Telemetry HUD
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold">
                DEV MODE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans block">
              Real-time voice turn extraction & sync-gate monitor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-sans"
            title="Copy structured JSON logs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Export</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors cursor-pointer"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metrics & Status Section */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex flex-col gap-2.5 shrink-0 font-sans">
        {/* Tier 1: Total AI Spend & Processed Tokens Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Card 1: Total AI Cost */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Total AI Cost
                </span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono tracking-tight leading-tight block">
                  {formattedCost}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-semibold block">
                3.5 Flash-Lite
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                $0.30 in / $2.50 out
              </span>
            </div>
          </div>

          {/* Card 2: Processed Tokens with In/Out Breakdown */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900/90 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Tokens Processed
                </span>
                <span className="text-lg font-extrabold text-indigo-200 font-mono tracking-tight leading-tight block">
                  {totalTokens.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-sky-300 border border-sky-500/25">
                <ArrowDownLeft className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{promptTokens.toLocaleString()} in</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-purple-300 border border-purple-500/25">
                <ArrowUpRight className="w-3 h-3 text-purple-400 shrink-0" />
                <span>{candidateTokens.toLocaleString()} out</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tier 2: Pipeline State & Sync Gate Control Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
          {/* Turn Sync */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Sync:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                syncStatus.isTurnSyncing
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {syncStatus.isTurnSyncing && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              )}
              {syncStatus.isTurnSyncing ? "IN-FLIGHT" : "IDLE"}
            </span>
          </div>

          {/* Final Gate */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Gate:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                syncStatus.pendingFinalModalOpen
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                  : "bg-emerald-950/60 text-emerald-300 border border-emerald-700/40"
              }`}
            >
              {syncStatus.pendingFinalModalOpen ? "LATCHED" : "OPEN"}
            </span>
          </div>

          {/* Stage */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Stage:</span>
            <span className="font-bold text-indigo-300 text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/40">
              {formatStageName(syncStatus.onboardingStage)}
            </span>
          </div>

          {/* Move-In */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Move-In:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                syncStatus.availableDate
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {syncStatus.availableDate || "PENDING"}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="px-3 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 font-sans text-[10px]">
        {["ALL", "AGORA", "SYNC-GATE", "EXTRACT-REQ", "EXTRACT-RES", "STATE-UPDATE"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.8 rounded-md font-semibold transition-colors shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Logs Event Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 select-text">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans">
            <Activity className="w-8 h-8 stroke-[1.5] mb-2 opacity-40 text-slate-400 animate-pulse" />
            <p className="text-xs font-semibold">No telemetry events logged yet</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
              Start a call with Elena Vance or answer questions to observe the real-time extraction pipeline.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const levelColor =
              log.level === "error"
                ? "border-red-500/50 bg-red-950/20 text-red-200"
                : log.level === "warn"
                ? "border-amber-500/50 bg-amber-950/20 text-amber-200"
                : log.level === "success"
                ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-200"
                : "border-slate-800 bg-slate-900/60 text-slate-200";

            return (
              <div
                key={log.id}
                className={`rounded-xl border transition-all ${levelColor} overflow-hidden`}
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-2.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-white/5 select-none"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 mt-0.5">
                      {log.timestamp}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0 font-sans ${
                        log.category === "EXTRACT-RES"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                          : log.category === "EXTRACT-REQ"
                          ? "bg-blue-950 text-blue-300 border border-blue-700/60"
                          : log.category === "SYNC-GATE"
                          ? "bg-amber-950 text-amber-300 border border-amber-700/60"
                          : log.category === "AGORA"
                          ? "bg-purple-950 text-purple-300 border border-purple-700/60"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {log.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-slate-100 line-clamp-2 break-words">
                        {log.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {log.details?.usage?.costFormatted && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded">
                        {log.details.usage.costFormatted}
                      </span>
                    )}
                    {typeof log.latencyMs === "number" && (
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.2 rounded">
                        {log.latencyMs}ms
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && log.details && (
                  <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/80 text-[11px] overflow-x-auto">
                    <pre className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {typeof log.details === "string"
                        ? log.details
                        : JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0 font-sans">
        <span>Showing {filteredLogs.length} events</span>
        <span>Kyron Real Estate Voice AI Diagnostic Engine</span>
      </div>
    </div>
  );
}
