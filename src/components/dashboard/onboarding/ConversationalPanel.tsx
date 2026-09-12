"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  User,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkle,
  ArrowDown,
  Mail,
  UserCheck,
} from "lucide-react";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import { PANEL_CARD_CLASSES, type EntryStage } from "./entry-choreography";
import type { UIAction, VoiceMessage } from "@/hooks/voice-agent-types";
import type { TurnMessage } from "@/lib/turn-extractor";
import { BASE_PATH } from "@/lib/base-path";

export interface VoiceControlState {
  isCallActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  /** Lets the studio hang up itself when the conduct guardrail trips or upon deploy completion. */
  endCall: () => Promise<void>;
  /**
   * Sends a text/prompt message to Elena Vance over Agora RTM. Studio-triggered cues pass
   * `append` so they never cut her off mid-sentence; see the voice agent rules doc.
   */
  sendTextMessage: (
    text: string,
    options?: { priority?: "interrupted" | "append" }
  ) => void | Promise<void>;
  voiceSessionId?: number | null;
  isAgentSpeaking?: boolean;
}

interface ConversationalPanelProps {
  onTurnExtraction?: (slidingWindow: TurnMessage[]) => void;
  onUIAction?: (action: UIAction) => void;
  onLogEvent?: (category: "AGORA" | "INTENT", title: string, details?: Record<string, unknown> | null) => void;
  isProcessing: boolean;
  activePipelineStep: string | null;
  /** Failure from the synthesis pipeline, shown beside the transcript; never a silent no-op. */
  pipelineError: string | null;
  onVoiceStateSync?: (state: VoiceControlState) => void;
  /** Which entry stage the studio is in; the panel never unmounts across them. */
  entryStage: EntryStage;
  /** Advances the studio to `focused`. Called only once the microphone is actually granted. */
  onMicGranted: () => void;
  ownerName?: string;
  ownerEmail?: string;
  /** Why the last call was hung up, when the studio ended it rather than the owner. */
  conductNotice?: string | null;
  /** Existing draft property ID, if resuming an existing draft. */
  draftId?: number | null;
}

export function ConversationalPanel({
  onTurnExtraction,
  onUIAction,
  onLogEvent,
  isProcessing,
  activePipelineStep,
  pipelineError,
  onVoiceStateSync,
  entryStage,
  onMicGranted,
  ownerName,
  ownerEmail,
  conductNotice,
  draftId,
}: ConversationalPanelProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

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
    isCallActive,
    isMuted,
    isAgentSpeaking,
    audioFrequencies,
    transcript,
    errorMessage,
    voiceSessionId,
    startCall,
    toggleMute,
    endCall,
    sendTextMessage,
  } = useAgoraVoiceAgent({
    onAgentTurnComplete: handleAgentTurnComplete,
    onUIAction,
    onLogEvent,
  });

  // Synchronize active call, mute, and text dispatch to parent
  useEffect(() => {
    onVoiceStateSync?.({
      isCallActive,
      isMuted,
      toggleMute,
      endCall,
      sendTextMessage,
      voiceSessionId,
      isAgentSpeaking,
    });
  }, [isCallActive, isMuted, toggleMute, endCall, sendTextMessage, voiceSessionId, isAgentSpeaking, onVoiceStateSync]);

  /**
   * Acquire the microphone before `startCall`, not during it. Agora asks for the mic at
   * step 4 of its connect sequence - after `/api/agora/session/start` has already created
   * a billed session - so a denial used to cost a session and the browser prompt landed
   * somewhere in the middle of the connect. Asking here makes the prompt immediate and
   * keeps a refused mic free. The tracks are stopped straight away; Agora opens its own.
   */
  const handleStart = useCallback(async () => {
    if (isRequestingMic) return;
    setMicError(null);
    setIsRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      onMicGranted();
      startCall(undefined, draftId ? Number(draftId) : undefined, "owner_onboarding");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setMicError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow it in your browser's address bar, then press Start again."
          : name === "NotFoundError"
          ? "No microphone was found. Connect one and press Start again."
          : "Could not open the microphone. Check your system sound settings and press Start again."
      );
    } finally {
      setIsRequestingMic(false);
    }
  }, [isRequestingMic, onMicGranted, startCall, draftId]);

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

  return (
    /* This is the card the entry choreography measures and flies; its per-stage size comes
       from PANEL_CARD_CLASSES, never from `h-full` against a content-sized parent. */
    <div
      className={`flex flex-col min-h-0 bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden text-slate-900 ${PANEL_CARD_CLASSES[entryStage]}`}
    >
      {/* 1. ELENA VANCE PERSONA BAR: Compact Sticky Bar when call active, Full Card when idle */}
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
                  src={`${BASE_PATH}/images/elena-vance-agent.webp`}
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
        /* Full Welcoming Persona Card when call is idle. On the intro card this block is
           the whole panel, so it - not the wrapper - has to be what scrolls on a short
           viewport: the panel root clips, so a wrapper scrollbar would never engage and
           the Start button would sit under the fold with no way to reach it. */
        <div
          className={`p-5 flex flex-col items-center text-center border-b border-slate-100 bg-gradient-to-b from-white via-slate-50/40 to-white relative ${
            entryStage === "intro" ? "min-h-0 overflow-y-auto" : "shrink-0"
          }`}
        >
          <div className="relative mb-3.5">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-slate-200 to-slate-300 shadow-xs">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-100 relative">
                <Image
                  src={`${BASE_PATH}/images/elena-vance-agent.webp`}
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

          {/* Who Elena will be talking to, read straight off the signed-in account. */}
          <div className="w-full mt-4 p-3 rounded-2xl bg-slate-50/80 border border-slate-200 text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-600" />
              <span>Listing as</span>
            </span>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-1">
              {ownerName || "Property Owner"}
            </p>
            {ownerEmail && (
              <p className="text-[11px] font-semibold text-slate-500 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{ownerEmail}</span>
              </p>
            )}
          </div>

          {conductNotice && !micError && (
            <div className="w-full mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-left flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-rose-900 leading-snug">{conductNotice}</p>
            </div>
          )}

          {micError && (
            <div className="w-full mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-amber-900 leading-snug">{micError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={isRequestingMic}
            className="w-full mt-3 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {isRequestingMic ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for microphone...</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4" />
                <span>{micError ? "Try again" : "Start"}</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 mt-2 leading-snug">
            Your browser will ask for microphone access.
          </p>
        </div>
      )}

      {/* 2. SCROLLABLE DIALOGUE CONTAINER (hidden behind the intro card - nothing to show yet) */}
      <div
        className={`flex-1 min-h-0 flex-col p-4 bg-slate-50/50 overflow-hidden relative ${
          entryStage === "intro" ? "hidden" : "flex"
        }`}
      >
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
                Speak to Elena naturally (e.g. &ldquo;It&apos;s a 3-bedroom rental on Golf Course Road for ₹95,000/month&rdquo;).
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

          {pipelineError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pipelineError}</span>
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
