"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  PhoneCall,
  ShieldCheck,
  Mic,
  Bot,
  User,
  Clock,
  CalendarCheck,
  MapPin,
  Users,
  Lock,
} from "lucide-react";

/**
 * Hero: one promise, one primary CTA, one visual anchor (a replayed call).
 * Every spoken line below must stay true to the facts in src/lib/demo-listing.ts —
 * the owner's floor is never named aloud, and no concession exists that isn't in that file.
 */

interface Scenario {
  id: string;
  tab: string;
  moment: string;
  timestamp: string;
  callerQuery: string;
  agentReply: string;
  proof: string;
  /** Where a visitor can reproduce this turn: the demo residence, or a fully onboarded listing. */
  liveOn: "demo" | "listing";
}

const SCENARIOS: Scenario[] = [
  {
    id: "after-hours",
    tab: "The 11pm question",
    moment: "A buyer scans the sign outside the building. Nobody is in the office.",
    timestamp: "23:14",
    callerQuery: "Can I bring my dog? And is parking extra on top of the rent?",
    agentReply:
      "Pets are welcome once they're registered with the society — there's a refundable deposit. Parking isn't extra: you get two reserved basement bays, and one of them has an EV charging point.",
    proof: "Answers only what the owner actually said. Nothing invented, nothing promised twice.",
    liveOn: "demo",
  },
  {
    id: "price",
    tab: "The lowball",
    moment: "The part most owners dread handing to anyone else.",
    timestamp: "23:16",
    callerQuery: "₹95,000 is over my budget. Can you do ₹88,000?",
    agentReply:
      "₹88,000 is under what the owner has authorised me to agree to, so I won't pretend otherwise. On an 18-month lease I can do ₹90,250, and if you move in within a week the first month's maintenance is waived. Shall I hold that for you?",
    proof: "Trades a concession for a longer lease. Never goes below your floor — and never reveals it.",
    liveOn: "demo",
  },
  {
    id: "location",
    tab: "\"Is it close?\"",
    moment: "The question every listing answers with an adjective.",
    timestamp: "23:18",
    callerQuery: "Everyone says 'prime location'. How far is it really from the metro?",
    agentReply:
      "Six minutes by car to the metro, nine to the nearest international school. Those are measured door-to-door times from this address — I don't use words like 'prime', I use minutes.",
    proof: "Measured when the listing is created — so it works on properties onboarded with their neighbourhood.",
    liveOn: "listing",
  },
  {
    id: "human",
    tab: "\"Get me a human\"",
    moment: "The moment a buyer usually hangs up and calls someone else.",
    timestamp: "23:21",
    callerQuery: "This is helpful, but can I just speak to the property manager?",
    agentReply:
      "Of course — calling them now. They'll get a quick private prompt so they're never caught off guard, and the moment they pick up I'll bring them into this call and step back.",
    proof: "A real person joins the live call within seconds — on any listing with a manager on file.",
    liveOn: "listing",
  },
];

const TRUST_CHIPS = [
  { icon: ShieldCheck, label: "Never quotes below your floor price" },
  { icon: Lock, label: "Only repeats facts you gave it" },
  { icon: CalendarCheck, label: "Books tours into your own calendar" },
  { icon: Users, label: "Puts a real human on the line on request" },
];

interface HeroVoiceSimulatorProps {
  /** Opens the persistent floating agent, who can search the whole catalogue. */
  onTalkToSarah: () => void;
  /** Opens a call scoped to the demo residence shown in the card. */
  onOpenCallModal: () => void;
}

export function HeroVoiceSimulator({ onTalkToSarah, onOpenCallModal }: HeroVoiceSimulatorProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("after-hours");
  const [typed, setTyped] = useState<{ scenarioId: string; text: string }>({
    scenarioId: "after-hours",
    text: "",
  });

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];
  // A scenario switch starts from an empty string without a synchronous reset inside the effect
  const typedText = typed.scenarioId === activeScenario.id ? typed.text : "";

  // Replays the agent's answer as if it were being spoken
  useEffect(() => {
    let currentIdx = 0;
    const { id: scenarioId, agentReply: fullText } = activeScenario;
    const interval = setInterval(() => {
      if (currentIdx <= fullText.length) {
        setTyped({ scenarioId, text: fullText.slice(0, currentIdx) });
        currentIdx += 3;
      } else {
        clearInterval(interval);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [activeScenario]);

  return (
    <section className="relative w-full">
      {/* Blueprint grid wash behind the fold */}
      <div className="absolute inset-0 luxury-grid pointer-events-none -z-10" aria-hidden="true" />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-14 md:pt-20 md:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* ---------- Left: the promise ---------- */}
        <div className="lg:col-span-6 flex flex-col items-start animate-soft-rise">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Sarah is live on this page right now — not a recorded demo</span>
          </div>

          <h1 className="mt-7 text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-slate-900 leading-[1.08]">
            Your listings now{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
              answer the phone
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Describe a property out loud and it is live in about two minutes — schools, commute
            times and neighbourhood facts already measured. After that, every buyer who calls it
            gets a straight answer within seconds: honest pricing, real distances, a tour slot in
            your calendar, and a human on the line the moment they ask for one.
          </p>

          {/* Primary conversion point */}
          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onTalkToSarah}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-blue-100" />
              <span>Talk to Sarah now</span>
            </button>

            <Link
              href="/dashboard/properties/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all hover:text-slate-900 hover:border-slate-300"
            >
              <span>List a property by talking</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Speak in two clicks. No form, no calendar invite, no sales call.{" "}
            <span className="text-slate-400">Listing a property needs a free account.</span>
          </p>

          {/* Trust strip — each chip answers an objection raised later on the page */}
          <ul className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-600">
            {TRUST_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <li key={chip.label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{chip.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---------- Right: a real call, replayed ---------- */}
        <div id="hero-simulator" className="lg:col-span-6 w-full animate-soft-rise">
          <div className="luxury-card rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-300/40 relative overflow-hidden">
            <div className="absolute -top-24 -right-16 w-72 h-72 bg-radial from-blue-400/15 via-indigo-300/5 to-transparent blur-2xl pointer-events-none -z-10" />

            {/* Caller HUD */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sarah — your leasing associate</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Golf Course Road, Gurugram</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-700">₹95,000/mo</span>
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-end gap-0.5 h-4">
                  {["0s", "0.2s", "0.1s", "0.35s", "0.15s"].map((delay) => (
                    <span
                      key={delay}
                      style={{ animationDelay: delay }}
                      className="w-0.5 rounded-full bg-emerald-600 animate-wave-bar"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-emerald-800">On the call</span>
              </div>
            </div>

            {/* Scenario tabs */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {SCENARIOS.map((scenario) => {
                const isActive = scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {scenario.tab}
                  </button>
                );
              })}
            </div>

            <p className="mt-3.5 text-xs text-slate-500 italic leading-relaxed">
              {activeScenario.moment}
            </p>

            {/* Transcript */}
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5 justify-end">
                <div className="max-w-sm bg-blue-50/80 border border-blue-100 rounded-2xl rounded-tr-xs px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[11px] font-bold text-blue-700">Buyer</span>
                    <span className="text-[10px] text-slate-400 tabular-nums flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {activeScenario.timestamp}
                    </span>
                  </div>
                  <p>{activeScenario.callerQuery}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-md bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 text-sm leading-relaxed shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-[11px] font-bold text-slate-900">Sarah</span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      answered instantly
                    </span>
                  </div>
                  {/* min-height keeps the card from reflowing while the reply types out */}
                  <p className="text-slate-800 font-medium min-h-[6.5rem] sm:min-h-[5.5rem]">
                    {typedText || activeScenario.agentReply}
                  </p>
                </div>
              </div>
            </div>

            {/* Why this answer is safe to hand over */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
                <span>{activeScenario.proof}</span>
              </div>
              {activeScenario.liveOn === "demo" ? (
                <button
                  type="button"
                  onClick={onOpenCallModal}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Try it on this flat</span>
                </button>
              ) : (
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Try it on a live listing</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
