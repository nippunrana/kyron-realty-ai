"use client";

import Link from "next/link";
import {
  Mic,
  MapPinned,
  QrCode,
  ArrowRight,
  Check,
  Timer,
} from "lucide-react";

/**
 * How it works — told from the owner's side, because that is where the friction is.
 * Each step's "on screen" list describes what the studio really produces.
 */

const STEPS = [
  {
    number: "01",
    eyebrow: "About two minutes, spoken",
    icon: Mic,
    title: "Say what you'd say to a friend",
    body: "No thirty-field form. It asks, you answer out loud, and it reads the details back so you can correct anything on the spot — mid-sentence if you like. It writes down only what you said, and marks the rest \"not specified\" rather than inventing a plausible answer.",
    onScreen: [
      "Rent or sale, address, price, beds, baths, size",
      "Your pet, parking and lease rules in your own words",
      "Corrections land instantly — \"actually, three bathrooms\"",
    ],
  },
  {
    number: "02",
    eyebrow: "The hour you'd normally lose",
    icon: MapPinned,
    title: "The neighbourhood fills itself in",
    body: "The part nobody enjoys: finding the metro station, the schools, the hospital, the market — and working out how long each one really takes from that exact door. It is assembled for you while you talk, with real measured travel times instead of the word \"nearby\".",
    onScreen: [
      "Transit, schools, hospitals and shopping found automatically",
      "Walking and driving times measured door to door",
      "Hear it read back and correct anything out loud, mid-call",
    ],
  },
  {
    number: "03",
    eyebrow: "Live before your coffee is cold",
    icon: QrCode,
    title: "It goes live — and starts taking the calls",
    body: "Scan a code to send photos straight from your phone, then publish. You get a proper listing page, a share card for WhatsApp, and a printable code for the board outside. From that moment the property answers its own enquiries, day and night.",
    onScreen: [
      "Photos uploaded from your phone while you're still talking",
      "Public page, share card and printable sign code",
      "Every caller answered, negotiated with, and booked in",
    ],
  },
];

export function ThreeStepEngine() {
  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section header */}
      <div className="max-w-3xl mb-12 md:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-4">
          <Timer className="w-3.5 h-3.5" />
          <span>From nothing to live in one conversation</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Adding a property should take a conversation, not an afternoon.
        </h2>
        <p className="mt-5 text-base text-slate-600 leading-relaxed">
          You already know everything about the flat. The only reason listing it takes an afternoon
          is the typing and the looking-up. So we removed both.
        </p>
      </div>

      {/* Stepped rail */}
      <ol className="relative">
        {/* Connecting line, desktop only */}
        <span
          aria-hidden="true"
          className="hidden md:block absolute left-[27px] top-8 bottom-8 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-transparent"
        />

        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.number} className="relative flex flex-col md:flex-row gap-6 md:gap-8 pb-10 md:pb-14 last:pb-0">
              {/* Rail marker */}
              <div className="shrink-0 flex md:flex-col items-center gap-3 md:gap-0">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600 relative z-10">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="md:mt-3 text-xs font-black tracking-widest text-slate-300 tabular-nums">
                  {step.number}
                </span>
              </div>

              {/* Copy */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                <div className="lg:col-span-7">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {step.eyebrow}
                  </span>
                  <h3 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                    {step.body}
                  </p>
                </div>

                {/* What lands on screen */}
                <div className="lg:col-span-5 luxury-card rounded-2xl p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What you get
                  </span>
                  <ul className="mt-3 space-y-2.5">
                    {step.onScreen.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Step-out CTA */}
      <div className="mt-4 md:mt-6 md:pl-[86px]">
        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-black rounded-xl shadow-md transition-all hover:-translate-y-0.5"
        >
          <Mic className="w-4 h-4" />
          <span>List your first property by talking</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
        <p className="mt-2.5 text-xs text-slate-500">
          Free account, no card. Your first listing is usually live before the call ends.
        </p>
      </div>
    </section>
  );
}
