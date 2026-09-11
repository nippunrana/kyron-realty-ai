"use client";

import Image from "next/image";
import { Sparkles, Check } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

interface SarahVoiceConciergeCardProps {
  onStartCall: () => void;
  propertyTitle: string;
}

export function SarahVoiceConciergeCard({
  onStartCall,
  propertyTitle,
}: SarahVoiceConciergeCardProps) {
  const avatarUrl = `${BASE_PATH}/images/salesagent.webp`;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Sarah Avatar & Live Badge */}
      <div className="flex items-center justify-between gap-3 mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-blue-500/30 shadow-md shadow-blue-600/30 shrink-0">
            <Image
              src={avatarUrl}
              alt="Sarah"
              fill
              sizes="44px"
              unoptimized={true}
              className="object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">
                Sarah
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              24/7 AI Voice Concierge
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Instant</span>
        </div>
      </div>

      {/* Pitch & Value Proposition */}
      <div className="space-y-3 mb-6 relative">
        <h4 className="text-base font-extrabold text-white leading-snug">
          Ask Sarah anything about {propertyTitle}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Skip waiting for an agent. Speak with our 24/7 AI Leasing Concierge in real-time.
        </p>

        <ul className="space-y-2 text-xs text-slate-300 pt-1">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Answers pricing, security deposit & lease questions</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Clarifies pet policies, parking spots & society rules</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Detailed metro routes, school commutes & neighborhood vibe</span>
          </li>
        </ul>
      </div>

      {/* Main Call Button */}
      <button
        type="button"
        onClick={onStartCall}
        className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 cursor-pointer group"
      >
        <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-white/40">
          <Image
            src={avatarUrl}
            alt="Sarah"
            fill
            sizes="20px"
            unoptimized={true}
            className="object-cover"
          />
        </div>
        <span>Talk to Sarah</span>
      </button>

      <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
        Zero wait • Free 24/7 instant voice call
      </p>
    </div>
  );
}
