"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
  Volume2,
  Sparkles,
  ArrowRight,
  PhoneCall,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  Bot,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";

interface Scenario {
  id: string;
  label: string;
  badge: string;
  userQuery: string;
  agentReply: string;
  insight: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "negotiate",
    label: "Rent Negotiation",
    badge: "Exchange of Value",
    userQuery: "Hey Sarah, the $3,450 rent is a bit steep for my budget. Can you do $3,150?",
    agentReply:
      "I can certainly lock in $3,150/mo for you if you're open to an 18-month lease starting on the 1st. I'll also waive the pet fee upfront. Would that timeline work for you?",
    insight: "Defends $3,250 floor price • Trades concession for longer lease commitment",
  },
  {
    id: "amenities",
    label: "Pets & EV Parking",
    badge: "Verified Knowledge Base",
    userQuery: "Does the Marina flat include assigned parking, and can I bring my 50lb Golden Retriever?",
    agentReply:
      "Yes, absolutely! The unit includes one assigned garage stall with Level-2 EV charging, and both dogs and cats up to 60 lbs are welcome with a refundable deposit.",
    insight: "Accurate to landlord specs • Zero hallucinations • Instant answer in <280ms",
  },
  {
    id: "booking",
    label: "Book In-Person Tour",
    badge: "Direct Calendar Close",
    userQuery: "Can I come see the flat in person this Thursday afternoon?",
    agentReply:
      "I have two private walkthrough slots open this Thursday: 2:00 PM and 4:30 PM. Which one works better for you? I can confirm it directly to your phone right now.",
    insight: "Captures qualified lead info • Books directly into broker CRM calendar",
  },
];

interface HeroVoiceSimulatorProps {
  onOpenCallModal: () => void;
}

export function HeroVoiceSimulator({ onOpenCallModal }: HeroVoiceSimulatorProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("negotiate");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [typedText, setTypedText] = useState<string>("");

  const activeScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  // Typing effect when switching scenario
  useEffect(() => {
    setTypedText("");
    let currentIdx = 0;
    const fullText = activeScenario.agentReply;
    const interval = setInterval(() => {
      if (currentIdx <= fullText.length) {
        setTypedText(fullText.slice(0, currentIdx));
        currentIdx += 3;
      } else {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [activeScenario]);

  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-14 md:pb-24 flex flex-col items-center">
      {/* Live Technology Pill */}
      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-xs mb-8 transition-all hover:bg-blue-100/90">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Powered by Agora Real-Time Conversational AI & SD-RTN</span>
        <span className="text-blue-400">|</span>
        <span className="text-blue-700 font-medium">Sub-300ms Voice</span>
      </div>

      {/* Hero Headline */}
      <h1 className="max-w-4xl text-center text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
        Never Lose a Real Estate Lead to{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
          Voicemail Again
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 max-w-2xl text-center text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
        The autonomous voice AI sales associate for high-ticket leasing and property sales.
        Answers caller inquiries in <strong className="text-slate-900 font-semibold">&lt;300ms</strong>,
        negotiates concessions within landlord guardrails, and books tours directly into your CRM.
      </p>

      {/* CTA Buttons Row */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenCallModal}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4 text-blue-100" />
          <span>Test Live Voice Call</span>
          <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded bg-blue-500/80 text-white">
            Live
          </span>
        </button>

        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-xs transition-all hover:text-slate-900 hover:border-slate-300"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>60-Sec Onboarding Studio</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Interactive Voice Simulator Card */}
      <div className="mt-12 w-full max-w-4xl">
        <div className="luxury-card rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden bg-white/95">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-blue-400/10 via-indigo-300/5 to-transparent blur-2xl pointer-events-none -z-10" />

          {/* Top Bar: Caller HUD Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Sarah — AI Leasing Specialist
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Online (Agora Voice)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>250 Marina Boulevard, SF</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">$3,450/mo</span>
                </p>
              </div>
            </div>

            {/* Live Audio Visualizer Bar */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause Waveform" : "Resume Waveform"}
                className="p-1 rounded-md text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-blue-600" />
                ) : (
                  <Play className="w-4 h-4 text-slate-500" />
                )}
              </button>

              <div className="flex items-center gap-1 h-8 px-1">
                {[
                  { delay: "0s", height: "14px" },
                  { delay: "0.2s", height: "24px" },
                  { delay: "0.1s", height: "18px" },
                  { delay: "0.4s", height: "28px" },
                  { delay: "0.15s", height: "12px" },
                  { delay: "0.35s", height: "22px" },
                  { delay: "0.25s", height: "16px" },
                  { delay: "0.05s", height: "26px" },
                  { delay: "0.3s", height: "20px" },
                  { delay: "0.45s", height: "10px" },
                ].map((bar, i) => (
                  <span
                    key={i}
                    style={{
                      animationDelay: isPlaying ? bar.delay : "0s",
                      height: isPlaying ? undefined : bar.height,
                    }}
                    className={`w-1 rounded-full ${
                      isPlaying
                        ? "bg-blue-600 animate-wave-bar"
                        : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                {isPlaying ? "260ms Latency" : "Paused"}
              </span>
            </div>
          </div>

          {/* Scenario Selector Pills */}
          <div className="mt-5 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Try Inbound Call Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((scenario) => {
                const isActive = scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    {scenario.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dialogue Display Box */}
          <div className="mt-5 space-y-3.5">
            {/* User Speech Bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-lg bg-blue-50/80 border border-blue-100 text-slate-900 rounded-2xl rounded-tr-xs px-4 py-3 text-sm leading-relaxed shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-blue-700">Inbound Caller</span>
                  <span className="text-[10px] text-slate-400">00:04</span>
                </div>
                <p>{activeScenario.userQuery}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Agent Speech Bubble */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-xl bg-slate-50 border border-slate-200/90 text-slate-900 rounded-2xl rounded-tl-xs px-4 py-3 text-sm leading-relaxed shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-900">Sarah (AI Agent)</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-blue-100 text-blue-800">
                      {activeScenario.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Spoken in 280ms
                  </span>
                </div>
                <p className="text-slate-800 font-medium">{typedText || activeScenario.agentReply}</p>
              </div>
            </div>
          </div>

          {/* Bottom Card Footer: Guardrail Insight & Live Call Action */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{activeScenario.insight}</span>
            </div>

            <button
              type="button"
              onClick={onOpenCallModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              <span>Speak live with Sarah right now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
