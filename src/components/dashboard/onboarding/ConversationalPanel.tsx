"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Link2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  Volume2,
  Send,
  Sparkles,
  Bot,
  User,
  Globe,
  Loader2,
  AlertCircle,
  Zap,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import { extractHeuristicAttributes, ExtractedPropertyPayload } from "@/lib/kb-extractor";

interface ConversationalPanelProps {
  onIngestUrl: (url: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onQuickUpdate?: (updates: Partial<ExtractedPropertyPayload["property"]>) => void;
  isProcessing: boolean;
  activePipelineStep: string | null;
  currentProperty?: ExtractedPropertyPayload["property"];
}

export function ConversationalPanel({
  onIngestUrl,
  onSendMessage,
  onQuickUpdate,
  isProcessing,
  activePipelineStep,
  currentProperty,
}: ConversationalPanelProps) {
  const [activeMode, setActiveMode] = useState<"url" | "chat">("url");
  const [urlInput, setUrlInput] = useState("");
  const [chatInput, setChatInput] = useState("");

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
    sendTextMessage,
  } = useAgoraVoiceAgent();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPropertyRef = useRef(currentProperty);
  currentPropertyRef.current = currentProperty;
  const recentExtractionsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, isProcessing]);

  // Handler for speech captured via Agora SD-RTN live transcripts
  const handleHandsFreeSpeech = useCallback(
    async (spokenText: string) => {
      const trimmed = spokenText.trim();
      if (!trimmed) return;

      // Deduplicate recent extractions to prevent double processing when typed text is echoed
      const normalized = trimmed.toLowerCase();
      const now = Date.now();
      const lastRun = recentExtractionsRef.current.get(normalized);
      if (lastRun && now - lastRun < 15000) {
        return;
      }
      recentExtractionsRef.current.set(normalized, now);

      // Clean up old entries if map grows
      if (recentExtractionsRef.current.size > 50) {
        for (const [key, timestamp] of recentExtractionsRef.current.entries()) {
          if (now - timestamp > 60000) {
            recentExtractionsRef.current.delete(key);
          }
        }
      }

      // 1. Instant deterministic extraction (<10ms) to tick off checklist items in real time
      const quickAttrs = extractHeuristicAttributes(
        trimmed,
        currentPropertyRef.current
      );
      if (Object.keys(quickAttrs).length > 0 && onQuickUpdate) {
        onQuickUpdate(quickAttrs);
      }

      // 2. Asynchronous deep extraction with Gemini for complete Knowledge Base
      try {
        await onSendMessage(trimmed);
      } catch (err) {
        console.error("Hands-free property extraction error:", err);
      }
    },
    [onQuickUpdate, onSendMessage]
  );

  // Switch modes: when user clicks "Voice & Chat", connect directly to Agora Voice Agent
  const handleModeChange = async (mode: "url" | "chat") => {
    setActiveMode(mode);
    if (mode === "chat") {
      if (callState === "idle" || callState === "error") {
        await startCall(undefined, undefined, "owner_onboarding", handleHandsFreeSpeech);
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isProcessing) return;
    const url = urlInput.trim();
    await onIngestUrl(url);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    const userText = chatInput.trim();
    setChatInput("");
    sendTextMessage(userText);
    await handleHandsFreeSpeech(userText);
  };

  const handleQuickPrompt = async (text: string) => {
    sendTextMessage(text);
    await handleHandsFreeSpeech(text);
  };

  const isCallActive =
    callState === "connecting" ||
    callState === "connected" ||
    callState === "user_speaking" ||
    callState === "agent_speaking";

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 overflow-hidden text-slate-900">
      {/* Top Mode Switcher Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">
              AI Onboarding Studio
            </h3>
            <p className="text-[11px] text-slate-500">
              Strict Agora SD-RTN Voice Agent • Gemini Brain
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Pills */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleModeChange("url")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === "url"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL Import</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("chat")}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === "chat"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Chat</span>
          </button>
        </div>
      </div>

      {/* URL Import Mode Card */}
      {activeMode === "url" && (
        <div className="p-5 border-b border-slate-100 bg-blue-50/30">
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Paste Listing URL (Zillow, Broker site, Portal)</span>
              <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Apify Crawler Active</span>
              </span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !urlInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Samples */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-2">
                Quick Test Samples:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setUrlInput(
                      "https://www.zillow.com/homedetails/250-Marina-Blvd-San-Francisco-CA-94123/20938472_zpid/"
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  🏡 Marina Luxury Loft ($3,450/mo)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUrlInput(
                      "https://www.realtor.com/realestateandhomes-detail/1850-Sunset-Blvd-Los-Angeles-CA-90026"
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  🌆 Sunset Modern Condo ($895,000)
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Voice Active Connection & Soundwave Visualizer HUD */}
      {activeMode === "chat" && (
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-slate-50/80">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {callState === "connecting" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span>Connecting to Agora SD-RTN...</span>
                </div>
              )}
              {callState === "connected" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Agora SD-RTN Live (&lt;300ms)</span>
                </div>
              )}
              {callState === "agent_speaking" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-extrabold animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Voice Agent Speaking...</span>
                </div>
              )}
              {callState === "user_speaking" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-extrabold animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-blue-700" />
                  <span>Listening Hands-Free...</span>
                </div>
              )}
              {callState === "error" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Voice session error</span>
                </div>
              )}
              {callState === "idle" && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  <span>Voice Session Idle</span>
                </div>
              )}
            </div>

            {/* Quick Audio Call Controls */}
            <div className="flex items-center gap-1.5">
              {isCallActive ? (
                <>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isMuted
                        ? "bg-amber-500 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={endCall}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-all cursor-pointer"
                    title="End Voice Call"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startCall(undefined, undefined, "owner_onboarding", handleHandsFreeSpeech)
                  }
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Connect Voice</span>
                </button>
              )}
            </div>
          </div>

          {/* 16-Bar Soundwave / Audio Visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-10 px-4 bg-slate-900 rounded-2xl shadow-inner">
            {audioFrequencies.map((freq, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isAgentSpeaking
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                    : isCallActive && !isMuted
                    ? "bg-blue-400 shadow-sm shadow-blue-400/50"
                    : "bg-slate-700"
                }`}
                style={{
                  height: `${Math.max(15, Math.min(95, freq))}%`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              <span>Hands-free WebRTC audio • No send button required</span>
            </span>
            <span className="font-semibold text-slate-600">
              {isAgentSpeaking ? "Agent Speaking" : isMuted ? "Muted" : "Hands-free listening"}
            </span>
          </div>
        </div>
      )}

      {/* Chat / Voice Transcript Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {transcript.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed animate-in fade-in duration-200 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                msg.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`p-3.5 rounded-2xl max-w-[82%] shadow-2xs ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-xs"
                  : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Real-time Extraction Pipeline Feedback */}
        {isProcessing && activePipelineStep && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-medium animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <span>{activePipelineStep}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <span className="text-slate-400 font-semibold shrink-0">Quick prompts:</span>
        <button
          type="button"
          onClick={() => handleQuickPrompt("It's for rent at $3,450/month")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          🏡 For Rent $3,450/mo
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("250 Marina Boulevard, San Francisco, CA 94123")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          📍 250 Marina Blvd, SF
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("2 bedrooms, 2 bathrooms, 1,150 square feet")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          🛏️ 2 Beds • 2 Baths • 1,150 sf
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Cats and dogs allowed with deposit, 1 garage space with EV charger included")}
          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
        >
          🐾 Pets & Parking
        </button>
      </div>

      {/* Bottom Chat & Voice Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
          {/* Text Input */}
          <input
            type="text"
            placeholder={
              isCallActive
                ? "Listening hands-free over Agora... or type here..."
                : "Type property specs, rules, or questions..."
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isProcessing}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isProcessing || !chatInput.trim()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
