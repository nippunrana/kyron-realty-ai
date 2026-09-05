"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Link2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Sparkles,
  User,
  Globe,
  Loader2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Sparkle,
  ChevronDown,
  ChevronUp,
  ArrowDown,
} from "lucide-react";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import type { UIAction, VoiceMessage } from "@/hooks/voice-agent-types";
import type { TurnMessage } from "@/lib/turn-extractor";
import { BASE_PATH } from "@/lib/base-path";

interface ConversationalPanelProps {
  onIngestUrl: (url: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onTurnExtraction?: (slidingWindow: TurnMessage[]) => void;
  onUIAction?: (action: UIAction) => void;
  isProcessing: boolean;
  activePipelineStep: string | null;
}

export function ConversationalPanel({
  onIngestUrl,
  onSendMessage,
  onTurnExtraction,
  onUIAction,
  isProcessing,
  activePipelineStep,
}: ConversationalPanelProps) {
  const [urlInput, setUrlInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isUrlBarExpanded, setIsUrlBarExpanded] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const handleCallEnd = useCallback(
    (finalTranscript: VoiceMessage[]) => {
      // Preserve full question & confirmation context with explicit role labels
      const formattedTranscript = finalTranscript
        .filter((m) => m.text && m.text.trim())
        .map((m) => `[${m.role === "assistant" ? "ELENA VANCE" : "OWNER"}]: ${m.text.trim()}`)
        .join("\n\n");

      if (formattedTranscript.trim()) {
        onSendMessage(formattedTranscript);
      }
    },
    [onSendMessage]
  );

  const handleAgentTurnComplete = useCallback(
    (currentTranscript: VoiceMessage[]) => {
      if (!currentTranscript || currentTranscript.length === 0) return;

      const meaningful = currentTranscript
        .filter((m) => m.text && m.text.trim())
        .slice(-6)
        .map((m) => ({
          role: m.role as "assistant" | "user",
          text: m.text.trim(),
        }));

      const hasUser = meaningful.some((m) => m.role === "user");
      const hasAssistant = meaningful.some((m) => m.role === "assistant");

      if (hasUser && hasAssistant && onTurnExtraction) {
        onTurnExtraction(meaningful);
      }
    },
    [onTurnExtraction]
  );

  const {
    callState,
    isMuted,
    isAgentSpeaking,
    audioFrequencies,
    transcript,
    errorMessage,
    startCall,
    toggleMute,
    endCall,
  } = useAgoraVoiceAgent({
    onCallEnd: handleCallEnd,
    onAgentTurnComplete: handleAgentTurnComplete,
    onUIAction,
  });

  const isProgrammaticScrollRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = transcriptContainerRef.current;
    if (container) {
      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      setIsScrolledUp(false);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 400);
    }
  }, []);

  // Auto-scroll strictly inside the container when enabled and not scrolled up
  useEffect(() => {
    if (autoScroll && !isScrolledUp) {
      scrollToBottom("smooth");
    }
  }, [transcript, isProcessing, autoScroll, isScrolledUp, scrollToBottom]);

  // Track user scroll position to pause auto-scroll if user scrolls up to read history
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = transcriptContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom > 50) {
      setIsScrolledUp(true);
    } else if (distanceFromBottom <= 20) {
      setIsScrolledUp(false);
    }
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isProcessing) return;
    const url = urlInput.trim();
    await onIngestUrl(url);
  };

  const isCallActive =
    callState === "connecting" ||
    callState === "connected" ||
    callState === "user_speaking" ||
    callState === "agent_speaking";

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden text-slate-900">
      {/* 1. TOP URL LISTING SCRAPER BAR (Collapsible during active calls) */}
      {isCallActive && !isUrlBarExpanded ? (
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-[11px] text-slate-700">Import from Listing URL</span>
            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-medium">
              Apify
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsUrlBarExpanded(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <span>Expand</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Import from Listing URL
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50/70 border border-blue-200/60 px-2 py-0.5 rounded-md">
                <Zap className="w-3 h-3 text-blue-600" />
                <span>Apify Crawler</span>
              </span>

              {isCallActive && (
                <button
                  type="button"
                  onClick={() => setIsUrlBarExpanded(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer pl-1"
                  title="Collapse URL Scraper"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Paste Zillow, Redfin, or brokerage link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !urlInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Ingesting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Extract</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Test Samples */}
          <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-100/80 text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Sample:</span>
            <button
              type="button"
              onClick={() => setUrlInput("https://www.zillow.com/homedetails/250-Marina-Blvd-San-Francisco-CA-94123/20938472_zpid/")}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors truncate max-w-[160px] cursor-pointer"
            >
              🏡 Marina Loft ($3,450)
            </button>
            <button
              type="button"
              onClick={() => setUrlInput("https://www.realtor.com/realestateandhomes-detail/1850-Sunset-Blvd-Los-Angeles-CA-90026")}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors truncate max-w-[160px] cursor-pointer"
            >
              🌆 Sunset Condo ($895k)
            </button>
          </div>
        </div>
      )}

      {/* 2. ELENA VANCE PERSONA BAR: Compact Sticky Bar when call active, Full Card when idle */}
      {isCallActive ? (
        <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
          {/* Left: Avatar + Speaking Beacon + Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`relative w-11 h-11 rounded-2xl overflow-hidden p-0.5 shrink-0 transition-all duration-300 ${
                isAgentSpeaking
                  ? "bg-gradient-to-tr from-emerald-500 via-teal-400 to-blue-500 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm"
              }`}
            >
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-100 relative">
                <Image
                  src={`${BASE_PATH}/images/elena-vance-agent.jpg`}
                  alt="Elena Vance"
                  fill
                  sizes="44px"
                  unoptimized
                  className="object-cover object-top"
                  priority
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  isAgentSpeaking ? "bg-emerald-500 animate-pulse" : "bg-blue-600"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  Elena Vance
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 block truncate">
                {isAgentSpeaking
                  ? "Elena is speaking..."
                  : callState === "user_speaking"
                  ? "Listening hands-free..."
                  : callState === "connecting"
                  ? "Connecting..."
                  : isMuted
                  ? "Microphone muted"
                  : "Listening • Speak naturally"}
              </span>
            </div>
          </div>

          {/* Center: Live Soundwave (Visible on sm+ screens) */}
          <div className="hidden sm:flex items-center gap-0.5 h-4 px-2 py-1 rounded-lg bg-slate-100/80 shrink-0">
            {audioFrequencies.slice(0, 8).map((freq, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isAgentSpeaking
                    ? "bg-emerald-500"
                    : callState === "user_speaking"
                    ? "bg-blue-600"
                    : "bg-slate-300"
                }`}
                style={{
                  height: `${Math.max(
                    25,
                    Math.min(
                      100,
                      isAgentSpeaking || callState === "user_speaking" ? freq : 25
                    )
                  )}%`,
                }}
              />
            ))}
          </div>

          {/* Right: Mute & End Call Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isMuted
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={endCall}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm shadow-red-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="End Conversation / Disconnect"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full Welcoming Persona Card when call is idle */
        <div className="p-5 flex flex-col items-center text-center border-b border-slate-100 bg-gradient-to-b from-white via-slate-50/40 to-white relative shrink-0">
          <div className="relative mb-3.5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-slate-200 to-slate-300 shadow-xs">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-100 relative">
                <Image
                  src={`${BASE_PATH}/images/elena-vance-agent.jpg`}
                  alt="Elena Vance - Principal AI Listing Specialist"
                  fill
                  sizes="112px"
                  unoptimized
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            <div className="absolute -bottom-1 -right-1 flex items-center">
              <span className="inline-flex rounded-full h-4 w-4 bg-slate-300 border-2 border-white" />
            </div>
          </div>

          <div className="max-w-xs">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Elena Vance
              </h2>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-bold">
                <Sparkle className="w-2.5 h-2.5" />
                <span>AI</span>
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-600 leading-snug">
              Principal Luxury Listing Specialist & Real Estate Partner
            </p>

            <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Agora SD-RTN</span>
              </span>
              <span>•</span>
              <span>&lt;300ms Audio Latency</span>
              <span>•</span>
              <span>Hands-Free</span>
            </div>
          </div>

          <div className="w-full mt-4">
            <div className="w-full p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1 h-5 shrink-0 px-1">
                  {[20, 20, 20, 20, 20, 20, 20, 20].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-slate-300"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="text-left truncate">
                  <span className="text-xs font-bold block leading-tight truncate">
                    Elena is ready to listen
                  </span>
                  <span className="text-[10px] block text-slate-500">
                    Click connect to begin voice onboarding
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startCall(undefined, undefined, "owner_onboarding")}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCROLLABLE DIALOGUE CONTAINER */}
      <div className="flex-1 min-h-0 flex flex-col p-4 bg-slate-50/50 overflow-hidden relative">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Live Dialogue Stream
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
              {transcript.length} turns
            </span>
          </div>

          {/* Auto-Scroll Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !autoScroll;
              setAutoScroll(next);
              if (next) {
                setIsScrolledUp(false);
                scrollToBottom("smooth");
              }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
              autoScroll
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoScroll ? "bg-blue-600 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>Auto-scroll {autoScroll ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Scrollable Transcript */}
        <div
          ref={transcriptContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 text-xs"
        >
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Mic className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                Conversation will appear here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px]">
                Speak to Elena naturally (e.g. &ldquo;It&apos;s a 2-bedroom rental on Marina Blvd for $3,450/month&rdquo;).
              </p>
            </div>
          ) : (
            transcript.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 animate-in fade-in duration-150 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role !== "user" && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 shadow-2xs">
                    EV
                  </div>
                )}

                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.role === "user" && (
                  <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 shadow-2xs">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Active Pipeline Feedback Bar */}
          {isProcessing && activePipelineStep && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
              <span className="truncate">{activePipelineStep}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Floating Resume Auto-Scroll Button */}
        {isScrolledUp && autoScroll && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20">
            <button
              type="button"
              onClick={() => {
                setIsScrolledUp(false);
                scrollToBottom("smooth");
              }}
              className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold shadow-lg backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <ArrowDown className="w-3 h-3 text-blue-400" />
              <span>Resume Auto-scroll</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
