"use client";

import {
  PhoneForwarded,
  ShieldCheck,
  CalendarCheck,
  EyeOff,
  Volume2,
  UserCheck,
} from "lucide-react";

/**
 * The trust centrepiece: an AI that knows when to stop being the answer.
 * Dark surface on a light page — this is the one moment the page raises its voice.
 */

const HANDOFF_BEATS = [
  {
    time: "0:00",
    speaker: "Buyer",
    line: "This is great, but can I actually speak to someone?",
    note: null,
  },
  {
    time: "0:02",
    speaker: "Sarah",
    line: "Of course — I'm calling your property manager right now. Stay with me.",
    note: "Your manager's phone rings. The buyer stays on the line.",
  },
  {
    time: "0:09",
    speaker: "Your manager",
    line: "[hears a private prompt] Press 1 to join the call, 2 if you're busy.",
    note: "Only they hear this. A buyer never lands in a voicemail or an unprepared hello.",
  },
  {
    time: "0:14",
    speaker: "Sarah",
    line: "Ravi has joined us. I'll leave you both to it — I'm here if you need me.",
    note: "She then goes silent and just listens, until somebody says her name.",
  },
  {
    time: "1:52",
    speaker: "Your manager",
    line: "Sarah, what was the deposit on this one again?",
    note: "One sentence, factual, then straight back to silence.",
  },
];

const GUARANTEES = [
  {
    icon: EyeOff,
    title: "Your manager's number is never exposed",
    body: "It is dialled from our servers. It is not on the page, not in the listing data, and not in anything the AI can say.",
  },
  {
    icon: Volume2,
    title: "It never talks over your people",
    body: "Once a human is on the call, the agent listens. It speaks again only when addressed by name.",
  },
  {
    icon: ShieldCheck,
    title: "It would rather say \"I don't know\"",
    body: "It answers from the facts you gave it. Anything you did not say stays unsaid, even under pressure.",
  },
];

export function LiveHumanHandoff() {
  return (
    <section id="live-human" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="rounded-3xl bg-slate-950 px-5 sm:px-10 py-12 md:py-16 relative overflow-hidden">
        {/* Ambient depth */}
        <div
          aria-hidden="true"
          className="absolute -top-40 -right-24 w-[520px] h-[520px] bg-radial from-blue-500/20 via-indigo-500/5 to-transparent blur-3xl pointer-events-none"
        />

        {/* Header */}
        <div className="max-w-2xl relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-semibold mb-5">
            <PhoneForwarded className="w-3.5 h-3.5" />
            <span>The moment buyers usually hang up</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-white leading-[1.12]">
            When they ask for a real person, they get one.
            <span className="text-blue-400"> In about ten seconds.</span>
          </h2>
          <p className="mt-5 text-base text-slate-300 leading-relaxed">
            Not &quot;someone will call you back&quot;. The agent rings your manager&apos;s actual
            phone, screens the call privately so they are never caught cold, brings them into the
            conversation — and then gets out of the way.
          </p>
        </div>

        {/* Handoff transcript + guarantees */}
        <div className="mt-11 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* Transcript */}
          <div className="lg:col-span-7 luxury-dark-card rounded-2xl p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                Live call, three people
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            </div>

            <ol className="mt-5 space-y-5">
              {HANDOFF_BEATS.map((beat) => (
                <li key={beat.time} className="flex items-start gap-4">
                  <span className="w-10 shrink-0 text-[11px] font-bold text-white/35 tabular-nums pt-0.5">
                    {beat.time}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      {beat.speaker}
                    </span>
                    <p className="mt-1 text-sm text-white/90 leading-relaxed">{beat.line}</p>
                    {beat.note && (
                      <p className="mt-1.5 text-xs text-white/45 leading-relaxed">{beat.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Side: booking + guarantees */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Calendar */}
            <div className="luxury-dark-card luxury-dark-card-hover rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">And the viewing books itself</h3>
              </div>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                &quot;Saturday morning?&quot; It checks when you are genuinely free, offers only
                real openings, and writes the hour into your calendar before the call ends.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { slot: "09:00", state: "free" },
                  { slot: "11:00", state: "booked" },
                  { slot: "16:00", state: "free" },
                ].map((s) => (
                  <div
                    key={s.slot}
                    className={`rounded-lg px-2 py-2.5 text-center border ${
                      s.state === "booked"
                        ? "bg-white/5 border-white/10 text-white/35"
                        : "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                    }`}
                  >
                    <span className="block text-xs font-bold tabular-nums">{s.slot}</span>
                    <span className="block text-[10px] font-semibold mt-0.5 capitalize">
                      {s.state === "booked" ? "Busy" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-white/40 leading-relaxed">
                Busy hours show as busy — never what you are doing, or with whom.
              </p>
            </div>

            {/* Guarantees */}
            <div className="luxury-dark-card rounded-2xl p-5 sm:p-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  What it will never do
                </span>
              </div>
              <ul className="space-y-4">
                {GUARANTEES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-sm font-semibold text-white">{item.title}</span>
                        <span className="block mt-1 text-xs text-white/50 leading-relaxed">
                          {item.body}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
