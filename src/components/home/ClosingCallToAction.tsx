"use client";

import Link from "next/link";
import { Mic, ArrowRight, Check } from "lucide-react";

/**
 * The close. One dominant action — talk to her — because the product proves itself
 * faster than any copy on this page can.
 */

const REASSURANCES = [
  "No card, no contract, no scheduled demo",
  "Nothing to install for you or your buyers",
  "Your first listing is usually live before the call ends",
];

interface ClosingCallToActionProps {
  onOpenCallModal: () => void;
}

export function ClosingCallToAction({ onOpenCallModal }: ClosingCallToActionProps) {
  return (
    <section id="start" className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-28 pt-4">
      <div className="luxury-card rounded-3xl px-6 sm:px-12 py-14 md:py-20 text-center relative overflow-hidden shadow-xl shadow-slate-200/50">
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[420px] bg-radial from-blue-400/15 via-indigo-300/5 to-transparent blur-3xl pointer-events-none"
        />

        <div className="relative max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Don&apos;t take our word for it.
            <br />
            <span className="text-blue-600">Try to catch her out.</span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
            Call her right now from this page and ask the awkward questions — haggle, interrupt her
            mid-sentence, demand a human. It takes ninety seconds, and it will tell you more than
            anything else on this page.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenCallModal}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
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

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            {REASSURANCES.map((line) => (
              <li key={line} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-medium">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
