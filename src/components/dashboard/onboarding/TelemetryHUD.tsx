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
  };
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
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-slate-950 text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200"
    >
      {/* HUD Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight font-sans">
                Pipeline Telemetry HUD
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold">
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
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
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

      {/* Live State & Sync Gate Status Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] shrink-0 font-sans">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Syncing:</span>
          <span
            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              syncStatus.isTurnSyncing
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {syncStatus.isTurnSyncing ? "IN-FLIGHT" : "IDLE"}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Final Gate:</span>
          <span
            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              syncStatus.pendingFinalModalOpen
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {syncStatus.pendingFinalModalOpen ? "LATCHED" : "OPEN"}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Stage:</span>
          <span className="font-bold text-indigo-300 text-[10px] truncate max-w-[80px]">
            {syncStatus.onboardingStage}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-slate-400">Move-In:</span>
          <span className="font-bold text-emerald-400 text-[10px] truncate max-w-[80px]">
            {syncStatus.availableDate || "None"}
          </span>
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
                    <div className="truncate min-w-0">
                      <span className="text-xs font-medium text-slate-100 line-clamp-1">
                        {log.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
