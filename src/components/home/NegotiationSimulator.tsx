"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Sliders,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { DEMO_LISTING } from "@/lib/demo-listing";

/**
 * Interactive proof that discounts are traded, never given away.
 * Outcomes below must only use concessions that exist in DEMO_LISTING.concessionRules,
 * and must never let the agent quote under DEMO_LISTING.minFloorPrice.
 */

const TARGET_PRICE = Number(DEMO_LISTING.price);
const FLOOR_PRICE = DEMO_LISTING.minFloorPrice;
// The only authorised discount: 5% off for an 18-month term, clamped so it can never
// fall under the owner's private floor no matter what the buyer proposes.
const LONG_LEASE_PRICE = Math.max(FLOOR_PRICE, Math.round(TARGET_PRICE * 0.95));

export function NegotiationSimulator() {
  const [callerBudget, setCallerBudget] = useState<number>(88000);
  const [leaseMonths, setLeaseMonths] = useState<number>(18);
  const [moveInQuick, setMoveInQuick] = useState<boolean>(true);

  const maintenanceLine = moveInQuick
    ? " And since you can take it within the week, the first month's maintenance is on us."
    : "";

  let outcomeType: "traded" | "held" | "standard" = "traded";
  let negotiatedRent = TARGET_PRICE;
  let ruleApplied = "";
  let spokenReply = "";

  if (callerBudget >= TARGET_PRICE) {
    outcomeType = "standard";
    negotiatedRent = TARGET_PRICE;
    ruleApplied = "Budget meets the asking rent — no discount offered, none needed.";
    spokenReply = `"Then we're already there — it's ₹${TARGET_PRICE.toLocaleString("en-IN")} a month.${moveInQuick ? " And if you move in within the week, the first month's maintenance is waived." : ""} Shall I hold a viewing for you this weekend?"`;
  } else if (leaseMonths >= 18 && callerBudget >= LONG_LEASE_PRICE) {
    outcomeType = "traded";
    negotiatedRent = LONG_LEASE_PRICE;
    ruleApplied = "18-month term traded for the 5% reduction.";
    spokenReply = `"On an 18-month lease I can bring that to ₹${LONG_LEASE_PRICE.toLocaleString("en-IN")} a month, which lands inside your budget.${maintenanceLine} Shall I put a viewing in?"`;
  } else if (leaseMonths >= 18) {
    outcomeType = "held";
    negotiatedRent = LONG_LEASE_PRICE;
    ruleApplied = "Best authorised price offered. Below it, the answer is an honest no.";
    spokenReply = `"₹${callerBudget.toLocaleString("en-IN")} is under what I'm authorised to agree to, and I'd rather tell you that than waste your evening. On the 18-month term the best I can do is ₹${LONG_LEASE_PRICE.toLocaleString("en-IN")}.${maintenanceLine} If that's still over your line, tell me your ceiling and I'll find you something that actually fits."`;
  } else {
    outcomeType = "held";
    negotiatedRent = TARGET_PRICE;
    ruleApplied = "No term offered in exchange — the asking rent stands.";
    spokenReply = `"I can move on price, but not for nothing. Stretch to an 18-month term and it becomes ₹${LONG_LEASE_PRICE.toLocaleString("en-IN")} a month.${maintenanceLine} On a ${leaseMonths}-month lease it stays at ₹${TARGET_PRICE.toLocaleString("en-IN")}. Which would you rather have?"`;
  }

  return (
    <section id="negotiation-engine" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section header */}
      <div className="max-w-3xl mb-12 md:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-4">
          <Scale className="w-3.5 h-3.5" />
          <span>Try to talk it down. Go on.</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          It negotiates like your best agent. Not like a chatbot with a discount button.
        </h2>
        <p className="mt-5 text-base text-slate-600 leading-relaxed">
          You set the lowest number you would ever accept. It is never spoken aloud, never shown on
          screen, and never handed to the buyer — the agent simply never crosses it. Every rupee it
          gives away buys you something back: a longer term, a faster move-in.
        </p>
      </div>

      {/* Interactive simulator */}
      <div className="luxury-card rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Buyer's side */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Play the buyer</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Answers update live</span>
            </div>

            {/* Budget */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">What they say they can pay</span>
                <span className="font-extrabold text-blue-600 text-sm tabular-nums">
                  ₹{callerBudget.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <input
                type="range"
                min="80000"
                max="100000"
                step="1000"
                value={callerBudget}
                onChange={(e) => setCallerBudget(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
                aria-label="Buyer budget"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>₹80,000</span>
                <span>Asking ₹{TARGET_PRICE.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Lease term */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                How long they will commit for
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[12, 18, 24].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setLeaseMonths(term)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      leaseMonths === term
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {term} months
                  </button>
                ))}
              </div>
            </div>

            {/* Move-in speed */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Can move in within a week
                </span>
                <span className="text-[11px] text-slate-500">
                  Fills your vacancy sooner — so it is worth something
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoveInQuick(!moveInQuick)}
                aria-pressed={moveInQuick}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  moveInQuick ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    moveInQuick ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Agent's reply */}
          <div className="lg:col-span-6 bg-slate-50/90 rounded-2xl p-6 border border-slate-200/90 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">What Sarah says back</span>
                </div>

                {outcomeType === "traded" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Traded, not given
                  </span>
                )}
                {outcomeType === "held" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Line held
                  </span>
                )}
                {outcomeType === "standard" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                    Full asking rent
                  </span>
                )}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="text-slate-500 block font-medium">Your rule that applied</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{ruleApplied}</span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-white border border-blue-100 text-sm text-slate-800 leading-relaxed font-medium shadow-xs italic min-h-[9rem]">
                {spokenReply}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Your private floor</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Never spoken, never crossed
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Rent it settles on</span>
                <span className="font-bold text-blue-700 text-sm tabular-nums">
                  ₹{negotiatedRent.toLocaleString("en-IN")}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400 text-center">
        Live example using the demo residence below. Your own floor price and trade rules are set
        when you list the property — and they are never sent to the AI as a number it could repeat.
      </p>
    </section>
  );
}
