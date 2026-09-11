"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { BASE_PATH } from "@/lib/base-path";
import { useAgoraVoiceAgent } from "@/hooks/useAgoraVoiceAgent";
import {
  Mic,
  MicOff,
  PhoneOff,
  X,
  Radio,
  Volume2,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface PageContextInfo {
  pageTitle: string;
}

/**
 * Derives current page title for light-weight context badge
 */
function getPageContext(pathname: string): PageContextInfo {
  if (pathname.startsWith("/listings/")) {
    const slug = pathname.replace(/^\/listings\//, "").split("/")[0];
    const formatted = slug
      ? slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Listing Detail";
    return { pageTitle: formatted };
  }
  if (pathname.startsWith("/listings")) {
    return { pageTitle: "Property Directory" };
  }
  if (pathname.startsWith("/login")) {
    return { pageTitle: "Sign In" };
  }
  if (pathname.startsWith("/privacy") || pathname.startsWith("/terms")) {
    return { pageTitle: "Legal Policies" };
  }
  return { pageTitle: "Home Showcase" };
}

export function FloatingSalesAgent() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Exit confirmation states
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Dashboard navigation interception states
  const [showDashboardAlert, setShowDashboardAlert] = useState(false);
  const [pendingDashboardHref, setPendingDashboardHref] = useState<string | null>(null);

  const context = useMemo(() => getPageContext(pathname), [pathname]);
  const avatarUrl = `${BASE_PATH}/images/sarah-sales-agent.jpg`;

  const {
    callState,
    isCallActive,
    isMuted,
    isAgentSpeaking,
    audioFrequencies,
    errorMessage,
    startCall,
    toggleMute,
    endCall,
  } = useAgoraVoiceAgent();

  const isDashboardRoute = pathname.startsWith("/dashboard");

  // If user enters dashboard while call was active, tear down call immediately
  useEffect(() => {
    if (isDashboardRoute && isCallActive) {
      endCall();
    }
  }, [isDashboardRoute, isCallActive, endCall]);

  // Intercept any client clicks to /dashboard links during an active call
  useEffect(() => {
    if (!isCallActive) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const cleanHref = href.replace(BASE_PATH, "");
      if (cleanHref === "/dashboard" || cleanHref.startsWith("/dashboard/")) {
        e.preventDefault();
        e.stopPropagation();
        setPendingDashboardHref(href);
        setShowDashboardAlert(true);
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [isCallActive]);

  // Microphone pre-flight check before initiating billed Agora session
  const handleStartCall = useCallback(async () => {
    setPermissionError(null);
    setIsRequestingMic(true);

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setIsRequestingMic(false);
      setPermissionError("Microphone permission was denied. Please allow microphone access in your browser to speak with Sarah.");
      return;
    }

    setIsRequestingMic(false);
    await startCall(undefined, undefined, "sales_agent");
  }, [startCall]);

  // Request close or disconnect with confirmation check
  const handleRequestDisconnect = useCallback(() => {
    if (isCallActive) {
      setShowExitConfirm(true);
    } else {
      setIsOpen(false);
    }
  }, [isCallActive]);

  // Confirmed disconnect
  const handleConfirmDisconnect = useCallback(async () => {
    setShowExitConfirm(false);
    await endCall();
    setIsOpen(false);
  }, [endCall]);

  // Dashboard navigation confirmation handlers
  const handleConfirmDashboardNav = useCallback(async () => {
    setShowDashboardAlert(false);
    await endCall();
    if (pendingDashboardHref) {
      router.push(pendingDashboardHref);
    }
  }, [endCall, pendingDashboardHref, router]);

  const handleCancelDashboardNav = useCallback(() => {
    setShowDashboardAlert(false);
    setPendingDashboardHref(null);
  }, []);

  // When inside the dashboard, Sarah is completely hidden and not rendered
  if (isDashboardRoute) {
    return null;
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* DASHBOARD NAVIGATION ALERT MODAL                                         */}
      {/* ========================================================================= */}
      {showDashboardAlert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard Navigation Alert"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Disconnect Call with Sarah?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Navigating to the Owner Dashboard will end your live call. The sales advisor is not accessible inside the dashboard workspace.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmDashboardNav}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Disconnect &amp; Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancelDashboardNav}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING SALES AGENT WIDGET                                              */}
      {/* ========================================================================= */}
      <aside
        aria-label="Kyron Sales Voice Agent"
        className="fixed bottom-5 right-5 z-40 select-none font-sans"
      >
        {/* ========================================================================= */}
        {/* LIGHT-MODE VOICE POD (Expanded)                                           */}
        {/* ========================================================================= */}
        {isOpen && (
          <div className="mb-3 w-[90vw] sm:w-[340px] max-w-[360px] bg-white/95 border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-900/15 backdrop-blur-xl text-slate-900 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl overflow-hidden ring-2 ring-blue-500/20 shadow-sm shrink-0">
                  <Image
                    src={avatarUrl}
                    alt="Sarah AI Sales Advisor"
                    fill
                    sizes="40px"
                    unoptimized={true}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Sarah</h3>
                    {isCallActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Voice</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium">
                        <span>Ready</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    AI Sales &amp; Leasing Associate
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestDisconnect}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close or disconnect voice assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Voice Arena */}
            <div className="p-6 flex flex-col items-center text-center">
              {/* Context Badge */}
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-[11px] font-medium">
                <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                <span>Viewing: {context.pageTitle}</span>
              </div>

              {/* Central Voice Avatar with Animated Pulse Rings */}
              <div className="relative mb-5 flex items-center justify-center">
                {/* Outer pulsing ripples when active */}
                {isCallActive && (
                  <>
                    <span className={`absolute inset-0 -m-3 rounded-full opacity-40 animate-ping ${isAgentSpeaking ? "bg-blue-400" : "bg-emerald-400"}`} />
                    <span className={`absolute inset-0 -m-1.5 rounded-full opacity-30 animate-pulse ${isAgentSpeaking ? "bg-blue-500" : "bg-emerald-500"}`} />
                  </>
                )}

                <div
                  className={`relative w-24 h-24 rounded-full overflow-hidden shadow-xl transition-all duration-300 ${
                    isAgentSpeaking
                      ? "ring-4 ring-blue-500 shadow-blue-500/20 scale-105"
                      : isCallActive
                      ? "ring-4 ring-emerald-500 shadow-emerald-500/20"
                      : "ring-4 ring-slate-100 shadow-slate-200"
                  }`}
                >
                  <Image
                    src={avatarUrl}
                    alt="Sarah AI Sales Advisor"
                    fill
                    sizes="96px"
                    unoptimized={true}
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Dynamic Status Text */}
              <div className="mb-4 min-h-[38px] flex flex-col items-center justify-center">
                {isRequestingMic ? (
                  <p className="text-xs font-semibold text-blue-600 animate-pulse">
                    Requesting microphone permission...
                  </p>
                ) : callState === "connecting" ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Connecting to Sarah via Agora...</span>
                  </div>
                ) : isAgentSpeaking ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                    <span>Sarah is speaking...</span>
                  </div>
                ) : isCallActive ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Listening... Speak naturally</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    Tap below to start voice conversation
                  </p>
                )}
              </div>

              {/* Real-time Frequency Visualizer (when active) */}
              {isCallActive && !showExitConfirm && (
                <div className="flex items-center justify-center gap-1 h-7 mb-4 px-4 py-1 rounded-xl bg-slate-50 border border-slate-100 w-full">
                  {audioFrequencies.slice(0, 14).map((freq, idx) => {
                    const heightPercent = Math.min(100, Math.max(15, (freq / 255) * 100));
                    return (
                      <span
                        key={idx}
                        style={{ height: `${heightPercent}%` }}
                        className={`w-1 rounded-full transition-all duration-75 ${
                          isAgentSpeaking ? "bg-blue-500" : "bg-emerald-500"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Error or Permission Alert */}
              {(permissionError || errorMessage) && !showExitConfirm && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5 text-left w-full">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">{permissionError || errorMessage}</span>
                </div>
              )}

              {/* Exit Confirmation View (Inline) */}
              {showExitConfirm ? (
                <div className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center animate-in fade-in duration-150 mb-2">
                  <p className="text-xs font-bold text-slate-900 mb-1">
                    Are you sure you want to close this call?
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Ending the call will stop the Agora voice session.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDisconnect}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Yes, End Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExitConfirm(false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Keep Talking
                    </button>
                  </div>
                </div>
              ) : (
                /* Controls: Start or Disconnect */
                <div className="w-full flex items-center gap-2">
                  {!isCallActive ? (
                    <button
                      type="button"
                      disabled={isRequestingMic || callState === "connecting"}
                      onClick={handleStartCall}
                      className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{callState === "connecting" ? "Connecting..." : "Start Conversation"}</span>
                    </button>
                  ) : (
                    <>
                      {/* Mute toggle */}
                      <button
                        type="button"
                        onClick={toggleMute}
                        className={`p-3 rounded-2xl border transition-colors cursor-pointer ${
                          isMuted
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                        }`}
                        title={isMuted ? "Unmute microphone" : "Mute microphone"}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* Disconnect Button (triggers confirmation prompt) */}
                      <button
                        type="button"
                        onClick={handleRequestDisconnect}
                        className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer"
                        title="Disconnect call to stop billing minutes"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/70 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Sub-300ms real-time voice • Agora &amp; Gemini</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESTING FLOATING PILL (Light Mode Luxury)                                 */}
        {/* ========================================================================= */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`group relative flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white/95 hover:bg-white border text-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer backdrop-blur-xl ${
            isCallActive
              ? "border-emerald-400 ring-2 ring-emerald-400/30"
              : "border-slate-200 hover:border-blue-300 ring-1 ring-slate-100"
          }`}
        >
          {/* Avatar with Live Indicator */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/20 group-hover:ring-blue-400 transition-all shrink-0">
            <Image
              src={avatarUrl}
              alt="Sarah AI Sales Advisor"
              fill
              sizes="36px"
              unoptimized={true}
              className="object-cover"
            />
            {/* Pulsing online/active badge */}
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                isCallActive ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
          </div>

          {/* Info Text */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                Sarah
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                • Sales AI
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCallActive ? "bg-emerald-500 animate-ping" : "bg-blue-500"
                }`}
              />
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px] sm:max-w-[150px]">
                {isCallActive ? "In Call • Speaking" : context.pageTitle}
              </span>
            </div>
          </div>

          {/* Mic Indicator */}
          <div className="ml-1 text-slate-400 group-hover:text-blue-600 transition-colors">
            <Mic className="w-3.5 h-3.5" />
          </div>
        </div>
      </aside>
    </>
  );
}
