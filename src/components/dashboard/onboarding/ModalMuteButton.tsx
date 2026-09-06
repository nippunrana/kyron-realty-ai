"use client";

import { Mic, MicOff } from "lucide-react";

interface ModalMuteButtonProps {
  isMuted: boolean;
  onToggleMute: () => void;
  className?: string;
}

export function ModalMuteButton({
  isMuted,
  onToggleMute,
  className = "",
}: ModalMuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggleMute}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer select-none shadow-xs ${
        isMuted
          ? "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-amber-500/20 border border-amber-600"
          : "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200/80 hover:text-slate-900"
      } ${className}`}
      title={
        isMuted
          ? "Unmute microphone (audio is currently blocked)"
          : "Mute microphone (block audio to Agora)"
      }
      aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
    >
      {isMuted ? (
        <>
          <MicOff className="w-3.5 h-3.5 shrink-0" />
          <span>Mic Muted</span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Mic className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Mic Live</span>
        </>
      )}
    </button>
  );
}
