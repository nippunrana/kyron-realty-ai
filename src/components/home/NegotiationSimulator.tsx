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

export function NegotiationSimulator() {
  const [callerBudget, setCallerBudget] = useState<number>(3150);
  const [leaseMonths, setLeaseMonths] = useState<number>(18);
  const [moveInQuick, setMoveInQuick] = useState<boolean>(true);

  const TARGET_PRICE = Number(DEMO_LISTING.price);
  const FLOOR_PRICE = DEMO_LISTING.minFloorPrice;

  // Compute negotiation outcome
  let outcomeType: "accepted_with_trade" | "alternative_pivot" | "standard_rate" = "accepted_with_trade";
  let negotiatedRent = TARGET_PRICE;
  let concessionText = "";
  let dialogueReply = "";

  if (callerBudget >= TARGET_PRICE) {
    outcomeType = "standard_rate";
    negotiatedRent = TARGET_PRICE;
    concessionText = "Standard rate accepted. Zero rent discount needed.";
    dialogueReply =
      `"Great! The asking rent is $${TARGET_PRICE}/mo. Let's schedule your private tour for this Thursday or Friday to lock this unit in before the weekend."`;
  } else if (callerBudget < 3000) {
    outcomeType = "alternative_pivot";
    negotiatedRent = 2850;
    concessionText = `Budget below $${FLOOR_PRICE.toLocaleString()} floor • Graceful Pivot to 1-Bed + Den inventory`;
    dialogueReply =
      `"I can't drop the 2-Bedroom unit below our landlord minimum of $${FLOOR_PRICE}/mo. However, we have a beautiful 1-Bed + Den unit with private terrace in the same building for $2,850/mo. Would you like to tour that one instead?"`;
  } else {
    outcomeType = "accepted_with_trade";
    if (leaseMonths >= 18 && moveInQuick) {
      negotiatedRent = Math.max(FLOOR_PRICE, callerBudget);
      concessionText = "18-Mo Lease + Fast Move-In Trade • Waive $200 Parking Fee + $250 Rent Reduction";
      dialogueReply =
        `"Here's what I can do: if you sign an 18-month lease starting by next Friday, I will approve $${negotiatedRent}/mo and waive the $200/month assigned parking fee entirely. Shall we book your walkthrough?"`;
    } else if (leaseMonths >= 18) {
      negotiatedRent = Math.max(FLOOR_PRICE, callerBudget);
      concessionText = "18-Mo Lease Commitment Trade • 5% Monthly Concession";
      dialogueReply =
        `"To accommodate your $${negotiatedRent}/mo target, our landlord requires an 18-month lease term. If that timeline works for you, I can lock in that price right now."`;
    } else if (moveInQuick) {
      negotiatedRent = 3350;
      concessionText = "Immediate Move-In Trade • Waive 1st Month Pet Deposit & $100 off rent";
      dialogueReply =
        `"I cannot reach $${callerBudget} on a 12-month lease, but if you can take possession by next week, I can do $3,350/mo and waive the entire pet deposit upfront."`;
    } else {
      negotiatedRent = TARGET_PRICE;
      concessionText = "No value trade provided • Floor price protected at standard terms";
      dialogueReply =
        `"The base rent is $${TARGET_PRICE}/mo. We can only adjust the price if you're open to an extended 18-month lease or an immediate move-in this week. Would either of those options be feasible?"`;
    }
  }

  return (
    <section id="negotiation-engine" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Exchange-of-Value Concession Matrix</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Negotiate Like a Senior Broker, Not a Dumb Chatbot
        </h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Unlike chatbots that either give blind discounts or say &quot;No&quot;, Kyron&apos;s AI employs an adaptive Give-and-Get concession ladder that fiercely defends landlord floor yields.
        </p>
      </div>

      {/* Interactive Simulator Container */}
      <div className="luxury-card rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/40 bg-white/95">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column (Left) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Caller Negotiation Inputs</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Test Live Response</span>
            </div>

            {/* Slider 1: Proposed Budget */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Caller Budget Offer:</span>
                <span className="font-extrabold text-blue-600 text-sm tabular-nums">
                  ${callerBudget.toLocaleString()}/mo
                </span>
              </div>
              <input
                type="range"
                min="2800"
                max="3500"
                step="50"
                value={callerBudget}
                onChange={(e) => setCallerBudget(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                <span>$2,800 (Low)</span>
                <span className="text-emerald-700 font-bold">${FLOOR_PRICE.toLocaleString()} Floor</span>
                <span>${TARGET_PRICE.toLocaleString()} (Target)</span>
              </div>
            </div>

            {/* Toggle 2: Lease Length */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Caller Lease Commitment Term:
              </label>
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
                    {term} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox 3: Fast Move In */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Move-In Within 7 Days?
                </span>
                <span className="text-[11px] text-slate-500">
                  Enables upfront parking & deposit concessions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoveInQuick(!moveInQuick)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
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

          {/* AI Response Output Column (Right) */}
          <div className="lg:col-span-6 bg-slate-50/90 rounded-2xl p-6 border border-slate-200/90 flex flex-col justify-between h-full shadow-xs">
            <div>
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Kyron Real-Time Strategy Engine
                  </span>
                </div>

                {outcomeType === "accepted_with_trade" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Give-Get Deal Locked
                  </span>
                )}
                {outcomeType === "alternative_pivot" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    Floor Protected / Pivot
                  </span>
                )}
                {outcomeType === "standard_rate" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                    Full Asking Rent
                  </span>
                )}
              </div>

              {/* Concession Summary Banner */}
              <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                <span className="text-slate-500 block font-medium">Applied Concession Rule:</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {concessionText}
                </span>
              </div>

              {/* Dynamic Spoken Dialogue Bubble */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sarah Spoken Reply (&lt;280ms):
                </span>
                <div className="p-4 rounded-xl bg-white border border-blue-100 text-sm text-slate-800 leading-relaxed font-medium shadow-xs italic">
                  {dialogueReply}
                </div>
              </div>
            </div>

            {/* Landlord Guardrail Strip */}
            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Landlord Floor Price:</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ${FLOOR_PRICE}/mo (Protected)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Agreed Rent:</span>
                <span className="font-bold text-blue-700 text-sm">
                  ${negotiatedRent}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
