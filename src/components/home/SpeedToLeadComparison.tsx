"use client";

import { XCircle, CheckCircle2, PhoneOff, PhoneCall, Clock, TrendingUp, Sparkles, Users } from "lucide-react";

export function SpeedToLeadComparison() {
  return (
    <section id="speed-to-lead" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold mb-3">
          <span>The $200B Speed-to-Lead Breakdown</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Why 78% of Inbound Property Leads Are Lost in the First 5 Minutes
        </h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          High-intent tenants and buyers call while standing outside the building or browsing 5 listings simultaneously.
          When nobody answers, they immediately dial the next broker.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: The Old Way */}
        <div className="luxury-card rounded-2xl p-6 sm:p-8 border border-rose-100 bg-gradient-to-b from-rose-50/30 via-white to-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <PhoneOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">The Traditional Way</h3>
                  <p className="text-xs text-slate-500">Manual voicemail & delayed replies</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                High Lead Attrition
              </span>
            </div>

            <ul className="mt-6 space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">62% of calls go to voicemail</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Brokers are showing flats, driving, or in meetings. Callers rarely leave voicemails.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">8x drop in conversion after 5 minutes</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Calling back hours later leads to unreturned tags and cold leads who already booked elsewhere.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">70% of human time wasted on repetitive specs</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Answering &quot;Are dogs allowed?&quot; or &quot;Is parking extra?&quot; 50 times per day burns out coordinators.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Rigid IVRs break on negotiation or interruptions</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Scripted keypress menus alienate high-ticket clients seeking lease flexibility.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Zero weekend or after-hours coverage</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Friday evening through Sunday inquiries sit abandoned until Monday morning.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-rose-100 flex items-center justify-between text-xs text-rose-800 bg-rose-50/80 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 rounded-b-2xl">
            <span className="font-semibold">Average conversion rate:</span>
            <span className="font-black text-sm text-rose-700">6.4%</span>
          </div>
        </div>

        {/* Right Column: The Kyron Way */}
        <div className="luxury-card rounded-2xl p-6 sm:p-8 border-2 border-blue-500/80 bg-gradient-to-b from-blue-50/40 via-white to-white flex flex-col justify-between shadow-lg shadow-blue-500/10 relative">
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Kyron Advantage</span>
          </div>

          <div>
            <div className="flex items-center justify-between pb-5 border-b border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">With Kyron Realty AI</h3>
                  <p className="text-xs text-blue-700 font-medium">Sub-300ms Autonomous Voice Associate</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                100% Lead Capture
              </span>
            </div>

            <ul className="mt-6 space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Instant pick-up in &lt;100ms via Agora RTC</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Never misses an inbound call. Engages every prospect on the very first ring, 24/7/365.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Natural turn-taking & mid-sentence interruptions</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Callers can speak freely, interrupt, or pivot requirements without lagging robotic pauses.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Autonomous Give-Get concession negotiation</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Defends landlord floor prices by exchanging discounts only for longer leases or quick move-ins.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Direct in-call viewing booking & CRM sync</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Schedules in-person walkthroughs, collects contact details, and notifies brokers instantly.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-slate-900">Warm human broker handoff with Live Context HUD</strong>
                  <p className="text-xs text-slate-500 mt-0.5">Seamlessly bridges hot cash buyers to human brokers over Agora with full call intelligence.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-blue-100 flex items-center justify-between text-xs text-blue-950 bg-blue-50/90 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 rounded-b-2xl">
            <span className="font-semibold">Average conversion to booked tour:</span>
            <span className="font-black text-sm text-emerald-600">38.2% (+5.9x)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
