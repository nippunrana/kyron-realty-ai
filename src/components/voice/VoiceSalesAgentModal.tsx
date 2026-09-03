"use client";

import { useEffect, useRef, useState } from "react";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import {
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Radio,
  Sparkles,
  Volume2,
  Calendar,
  Send,
  X,
  ShieldCheck,
  Building2,
  Bot,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";

interface VoiceSalesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id?: number;
    title: string;
    slug: string;
    price: string | number;
    listingType?: string;
    address?: string;
    city?: string;
    coverImageUrl?: string;
  };
}

export function VoiceSalesAgentModal({
  isOpen,
  onClose,
  property,
}: VoiceSalesAgentModalProps) {
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

  const [textInput, setTextInput] = useState("");
  const [showBookingDrawer, setShowBookingDrawer] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("2026-09-06T15:00");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (!isOpen) return null;

  const isCallActiveOrConnecting =
    callState === "connecting" ||
    callState === "connected" ||
    callState === "user_speaking" ||
    callState === "agent_speaking";

  // When user clicks the top "X" or backdrop
  const handleRequestClose = () => {
    if (isCallActiveOrConnecting) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // Direct "End Call" action from active call HUD
  const handleEndCall = async () => {
    setShowExitConfirm(false);
    await endCall();
    onClose();
  };

  // Confirm exit during active call
  const handleConfirmExit = async () => {
    setShowExitConfirm(false);
    await endCall();
    onClose();
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendTextMessage(textInput);
      setTextInput("");
    }
  };

  const handleQuickQuestion = (q: string) => {
    sendTextMessage(q);
  };

  const handleBookTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingName && bookingPhone) {
      setBookingConfirmed(true);
      sendTextMessage(`I'd like to confirm a viewing tour for ${bookingName} (${bookingPhone}) at ${bookingDate}.`);
      setTimeout(() => {
        setShowBookingDrawer(false);
        setBookingConfirmed(false);
      }, 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleRequestClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full h-[90vh] max-h-[720px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative text-slate-900">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/20">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Sarah • AI Leasing Advisor
                </h3>
                {isCallActiveOrConnecting ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>&lt;300ms Agora SD-RTN</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                    Voice Agent Standby
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs">
                {property.title}
              </p>
            </div>
          </div>

          <button
            onClick={handleRequestClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close voice modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PRE-CALL SCREEN (When call is idle or has not started yet)                 */}
        {/* ========================================================================= */}
        {callState === "idle" && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
            <div>
              {/* Property Mini Banner */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 flex items-center gap-4 mb-6">
                {property.coverImageUrl ? (
                  <img
                    src={property.coverImageUrl}
                    alt={property.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {property.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {property.address || property.city || "Verified Residence"}
                  </p>
                  <p className="text-xs font-black text-blue-600 mt-0.5">
                    ${Number(property.price).toLocaleString()}
                    {property.listingType === "rent" ? "/month" : ""}
                  </p>
                </div>
              </div>

              {/* What Sarah can do */}
              <div className="space-y-3 mb-6">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  What Sarah can help you with:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Sub-300ms Voice</span>
                      <span className="text-[11px] text-slate-500">Instant answers with zero awkward delays</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Concession Guardrails</span>
                      <span className="text-[11px] text-slate-500">Negotiate rent & move-in dates live</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Verified Policies</span>
                      <span className="text-[11px] text-slate-500">Pet rules, EV charging & garage stalls</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Tour Scheduling</span>
                      <span className="text-[11px] text-slate-500">Book in-person walkthroughs on the spot</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message if previous attempt failed */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => startCall(property.slug, property.id)}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Start Voice Call with Sarah</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2.5">
                Microphone access will be requested to enable real-time two-way audio.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ACTIVE / CONNECTING CALL HUD                                              */}
        {/* ========================================================================= */}
        {callState !== "idle" && (
          <>
            {/* Dynamic Voice Visualizer Section */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden shrink-0">
              {/* Status Indicator */}
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-md">
                {callState === "connecting" && (
                  <>
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Connecting to Agora Voice Engine...</span>
                  </>
                )}
                {callState === "connected" && (
                  <>
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Listening... Speak naturally anytime</span>
                  </>
                )}
                {callState === "user_speaking" && (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                    <span>You are speaking (VAD Active)</span>
                  </>
                )}
                {callState === "agent_speaking" && (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                    <span>Sarah is speaking...</span>
                  </>
                )}
                {callState === "error" && (
                  <span className="text-red-400">Connection Error</span>
                )}
              </div>

              {/* Animated Waveform Visualizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-sm px-4">
                {audioFrequencies.map((freq, idx) => {
                  const height = isAgentSpeaking
                    ? Math.max(20, Math.min(100, Math.round(Math.sin(idx + Date.now() / 200) * 30 + 50)))
                    : freq;

                  return (
                    <div
                      key={idx}
                      style={{ height: `${height}%` }}
                      className={`w-2.5 rounded-full transition-all duration-75 ${
                        isAgentSpeaking
                          ? "bg-gradient-to-t from-blue-500 to-purple-400"
                          : "bg-gradient-to-t from-blue-600 to-emerald-400"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Subtitle / Live Speaking Hint */}
              <p className="text-[11px] text-slate-400 mt-3 font-mono">
                {callState === "connecting"
                  ? "Securing Agora SD-RTN audio channel..."
                  : isAgentSpeaking
                  ? "Press Mute or speak to interrupt"
                  : "Opus 48kHz HD Audio Active"}
              </p>
            </div>

            {/* Live Conversation Transcript Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50">
              {transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 text-xs animate-in fade-in duration-200 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${
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
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-bold opacity-75">
                        {msg.role === "user" ? "You" : "Sarah (Advisor)"}
                      </span>
                      <span className="text-[9px] opacity-60 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-semibold shrink-0">Ask Sarah:</span>
              <button
                type="button"
                onClick={() => handleQuickQuestion("Is the monthly rent negotiable?")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer"
              >
                💰 Is rent negotiable?
              </button>
              <button
                type="button"
                onClick={() => handleQuickQuestion("What are the pet and parking policies?")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer"
              >
                🚗 Parking & Pets?
              </button>
              <button
                type="button"
                onClick={() => setShowBookingDrawer(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold whitespace-nowrap border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                <span>Book Tour</span>
              </button>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mx-4 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center justify-between gap-2">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => startCall(property.slug, property.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Bottom Control & Call Actions Bar */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Text input fallback */}
              <form onSubmit={handleSendText} className="flex-1 flex gap-2 w-full">
                <input
                  type="text"
                  placeholder="Or type a message to Sarah..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Primary Voice Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Mute Button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isMuted
                      ? "bg-amber-500 text-white border-amber-600 shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>
            </div>

            {/* Tour Booking Slide-Over Drawer */}
            {showBookingDrawer && (
              <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl z-30 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Schedule In-Person Walkthrough
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBookingDrawer(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {bookingConfirmed ? (
                  <div className="py-4 text-center text-emerald-600 flex flex-col items-center">
                    <CheckCircle2 className="w-8 h-8 mb-1" />
                    <span className="font-bold text-xs">Viewing Confirmed!</span>
                    <span className="text-[11px] text-slate-500">Sarah has logged your tour appointment.</span>
                  </div>
                ) : (
                  <form onSubmit={handleBookTour} className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Full Name"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number (e.g. 415-555-0199)"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      />
                    </div>
                    <input
                      type="datetime-local"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Confirm Tour Booking with Sarah
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* EXIT CONFIRMATION MODAL OVERLAY                                           */}
        {/* ========================================================================= */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                End active conversation?
              </h4>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Disconnecting will terminate your live audio connection with Sarah.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Stay in Call
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-red-600/20"
                >
                  End & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
