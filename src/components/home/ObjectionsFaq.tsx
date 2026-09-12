"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

/**
 * FUD reduction, placed immediately before the final ask.
 * Every answer here must be defensible against how the product actually behaves.
 */

const FAQS = [
  {
    q: "Will it make things up to close a deal?",
    a: "No. It can only repeat what you told it about the property. Anything you did not mention comes back as \"not specified\" rather than a confident guess — because one invented lease term is worse than a hundred unanswered calls.",
  },
  {
    q: "Will it quietly undercut my price?",
    a: "The lowest number you will accept is never written into the agent's script, so it cannot be repeated, leaked or negotiated away. A discount only appears when the buyer offers something back — a longer term, a faster move-in — and only within the trades you approved.",
  },
  {
    q: "Do buyers know they are talking to an AI?",
    a: "Yes. She introduces herself as an AI associate, and the moment anyone asks for a person she rings your manager and brings them onto the call. No pretending, no trapping people in a loop.",
  },
  {
    q: "Do I have to hand over my calendar?",
    a: "It only ever sees whether an hour is free or busy — never the titles, guests or details of your meetings. Bookings are written into a separate calendar created for your listings, and your own events are never touched.",
  },
  {
    q: "Is my manager's phone number exposed anywhere?",
    a: "Never. The call is placed from our servers. The number is not in the page, not in the listing data, and not in anything the AI is able to say out loud.",
  },
  {
    q: "Does anyone need to install an app?",
    a: "No. Buyers talk from the listing page in their browser. Your manager just answers an ordinary phone call. You list a property by talking, from any device with a microphone.",
  },
  {
    q: "What if I get a detail wrong while listing it?",
    a: "Say it out loud — \"actually the deposit is two months\" — and it corrects itself mid-conversation. No going back through a form to hunt for the field you mistyped.",
  },
];

export function ObjectionsFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="questions" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Header rail */}
        <div className="lg:col-span-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>The things people ask before trusting it</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.14]">
            Handing over your calls is a big ask.
          </h2>
          <p className="mt-5 text-base text-slate-600 leading-relaxed">
            So here are the blunt answers to what owners and managers actually worry about — the
            ones that decide whether this is worth trying at all.
          </p>
        </div>

        {/* Accordion */}
        <div className="lg:col-span-8">
          <ul className="divide-y divide-slate-200/80 border-y border-slate-200/80">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <li key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-start justify-between gap-6 py-5 text-left cursor-pointer group"
                  >
                    <span
                      className={`text-base font-bold leading-snug transition-colors ${
                        isOpen ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"
                      }`}
                    >
                      {faq.q}
                    </span>
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
                        isOpen
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-200 text-slate-500 group-hover:border-slate-300"
                      }`}
                    >
                      {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <p className="pb-6 -mt-1 pr-12 text-sm text-slate-600 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
