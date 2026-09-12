"use client";

import { PhoneOff, ClipboardList, Clock3, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

/**
 * Pain → Agitate. Names the three places a property business leaks money,
 * then replays the same evening twice so the cost is felt rather than claimed.
 * Deliberately free of invented conversion statistics.
 */

const LEAKS = [
  {
    icon: PhoneOff,
    title: "The call you never heard",
    body: "Buyers ring while they are standing on the pavement outside the building, comparing five listings at once. You are driving, showing another flat, or asleep. They do not leave a voicemail — they dial the next number on the next sign.",
    cost: "One missed ring is one lost tenant",
  },
  {
    icon: ClipboardList,
    title: "The listing still sitting in your drafts",
    body: "Thirty fields. Photos stuck on your phone. And the part everyone quietly skips: looking up the metro station, the schools, the hospital, and how long each actually takes from that exact door. So the property waits a week to go live.",
    cost: "Every unlisted day is a paid-for empty day",
  },
  {
    icon: Clock3,
    title: "The small question that cost the deal",
    body: "\"Is the deposit negotiable?\" \"Can I park two cars?\" \"Are dogs allowed?\" Tiny answers — but they arrive two days later, by which time the buyer has already signed somewhere that answered on the spot.",
    cost: "Speed decides who gets the signature",
  },
];

const WITHOUT_KYRON = [
  { time: "21:40", text: "Buyer scans the board outside. Calls. It rings out." },
  { time: "21:41", text: "They call the next agent on the next board." },
  { time: "09:15", text: "You see a missed call with no name attached to it." },
  { time: "09:40", text: "You call back. It goes to voicemail. You try twice more." },
  { time: "Friday", text: "They have signed elsewhere. You never learn why." },
];

const WITH_KYRON = [
  { time: "21:40", text: "Buyer scans the board. Sarah picks up on the first ring." },
  { time: "21:42", text: "Pets, parking, deposit, metro distance — all answered, correctly." },
  { time: "21:44", text: "Budget is short. She trades a discount for a longer lease. Your floor holds." },
  { time: "21:46", text: "\"Can I meet someone?\" She rings your manager and bridges them in." },
  { time: "21:49", text: "Saturday, 11am viewing is in your calendar before you wake up." },
];

export function MissedCallCost() {
  return (
    <section id="the-problem" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      {/* Section header */}
      <div className="max-w-3xl mb-12 md:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-4">
          <span>Where the money actually leaks</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          You are not losing deals on price.
          <br className="hidden sm:block" />
          <span className="text-slate-400"> You are losing them on silence.</span>
        </h2>
        <p className="mt-5 text-base text-slate-600 leading-relaxed">
          Nobody loses a property because the flat was wrong. They lose it because nobody picked
          up, the listing was not up yet, or the answer came a day late.
        </p>
      </div>

      {/* Three leaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {LEAKS.map((leak) => {
          const Icon = leak.icon;
          return (
            <article
              key={leak.title}
              className="luxury-card luxury-card-hover rounded-2xl p-6 sm:p-7 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 leading-snug">{leak.title}</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{leak.body}</p>
              <p className="mt-5 pt-4 border-t border-slate-100 text-xs font-bold text-rose-700">
                {leak.cost}
              </p>
            </article>
          );
        })}
      </div>

      {/* The same evening, twice */}
      <div className="mt-14 md:mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            One Tuesday evening, replayed twice
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Same buyer. Same flat. Different phone.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Without */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 border border-rose-100 bg-gradient-to-b from-rose-50/40 via-white to-white">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <h4 className="text-base font-bold text-slate-900">Tonight, without Kyron</h4>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">
                Lead lost
              </span>
            </div>
            <ol className="mt-5 space-y-4">
              {WITHOUT_KYRON.map((step) => (
                <li key={step.time} className="flex items-start gap-3.5">
                  <span className="w-14 shrink-0 text-[11px] font-bold text-slate-400 tabular-nums pt-0.5">
                    {step.time}
                  </span>
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600 leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* With */}
          <div className="luxury-card rounded-2xl p-6 sm:p-8 border-2 border-blue-500/70 bg-gradient-to-b from-blue-50/50 via-white to-white shadow-lg shadow-blue-500/10 relative">
            <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-sm">
              The same nine minutes
            </span>
            <div className="flex items-center justify-between pb-4 border-b border-blue-100">
              <h4 className="text-base font-bold text-slate-900">Tonight, with Kyron</h4>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                Viewing booked
              </span>
            </div>
            <ol className="mt-5 space-y-4">
              {WITH_KYRON.map((step) => (
                <li key={step.time} className="flex items-start gap-3.5">
                  <span className="w-14 shrink-0 text-[11px] font-bold text-blue-600 tabular-nums pt-0.5">
                    {step.time}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>
            <a
              href="#how-it-works"
              className="mt-6 pt-4 border-t border-blue-100 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>See how that evening is set up in two minutes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
