"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { VoiceMessage, CallState } from "@/hooks/voice-agent-types";
import { Mic, User, PhoneCall } from "lucide-react";

export interface SalesDialogueStreamProps {
  transcript: VoiceMessage[];
  isAgentSpeaking: boolean;
  callState: CallState;
}

export function SalesDialogueStream({
  transcript,
  isAgentSpeaking,
  callState,
}: SalesDialogueStreamProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
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

  // Auto-scroll inside container when new transcript turns arrive
  useEffect(() => {
    if (autoScroll && !isScrolledUp) {
      scrollToBottom("smooth");
    }
  }, [transcript, autoScroll, isScrolledUp, scrollToBottom]);

  // Track user scroll position to pause auto-scroll if user scrolls up to review history
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = transcriptContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom > 40) {
      setIsScrolledUp(true);
    } else if (distanceFromBottom <= 15) {
      setIsScrolledUp(false);
    }
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3.5 bg-slate-50/60 overflow-hidden relative">
      {/* Stream Controls Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Live Dialogue Stream
          </span>
          <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
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
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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

      {/* Scrollable Dialogue Bubble Container */}
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
            <p className="text-xs font-semibold text-slate-700">
              Conversation will appear here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px]">
              Speak naturally (e.g. &ldquo;Is there any pet-friendly property in Faridabad?&rdquo;).
            </p>
          </div>
        ) : (
          transcript.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 animate-in fade-in duration-150 ${
                msg.role === "user" || msg.role === "manager" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 shadow-2xs">
                  SA
                </div>
              )}

              <div
                className={`px-3.5 py-2 rounded-2xl max-w-[82%] text-xs leading-relaxed shadow-2xs ${
                  msg.role === "manager"
                    ? "bg-blue-600 text-white rounded-tr-xs border border-blue-500 shadow-blue-500/10"
                    : msg.role === "user"
                    ? "bg-slate-900 text-white rounded-tr-xs"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                }`}
              >
                {msg.role === "manager" && (
                  <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <span>Property Manager</span>
                  </div>
                )}
                <p>{msg.text}</p>
              </div>

              {msg.role === "manager" && (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 shadow-2xs" title="Property Manager">
                  <PhoneCall className="w-3 h-3" />
                </div>
              )}

              {msg.role === "user" && (
                <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0 mt-1 shadow-2xs" title="You">
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Dynamic Speaking Feedback Pill */}
        {isAgentSpeaking && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/80 border border-blue-200/60 text-blue-700 text-[10px] font-semibold w-fit animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>Sarah is speaking...</span>
          </div>
        )}

        {callState === "user_speaking" && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 text-[10px] font-semibold w-fit ml-auto animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <span>Listening to you...</span>
          </div>
        )}
      </div>
    </div>
  );
}
