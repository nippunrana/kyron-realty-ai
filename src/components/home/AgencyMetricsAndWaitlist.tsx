"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Loader2,
  Building,
} from "lucide-react";

export function AgencyMetricsAndWaitlist() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Property Manager");
  const [portfolioSize, setPortfolioSize] = useState("11 - 50 Units");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid work or personal email address.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <section id="waitlist" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Metric Cards Banner */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-3">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Quantified Broker & Agency ROI</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Proven Impact for Growing Portfolios
        </h2>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Transforming missed calls into closed leases while saving coordinators hundreds of hours of repetitive phone calls.
        </p>
      </div>

      {/* 4-Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
        <div className="luxury-card rounded-2xl p-6 text-center border border-slate-200/90 shadow-xs">
          <span className="text-3xl sm:text-4xl font-black text-blue-600 tabular-nums">
            +22
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">Extra Leases / Year</h4>
          <p className="text-xs text-slate-500 mt-1">Per 500 managed units via zero-drop after-hours coverage</p>
        </div>

        <div className="luxury-card rounded-2xl p-6 text-center border border-slate-200/90 shadow-xs">
          <span className="text-3xl sm:text-4xl font-black text-indigo-600 tabular-nums">
            65%
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">Coordinator Time Saved</h4>
          <p className="text-xs text-slate-500 mt-1">Eliminating repetitive pet, parking, and utility questions</p>
        </div>

        <div className="luxury-card rounded-2xl p-6 text-center border border-slate-200/90 shadow-xs">
          <span className="text-3xl sm:text-4xl font-black text-emerald-600 tabular-nums">
            &lt;300ms
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">Agora Voice Latency</h4>
          <p className="text-xs text-slate-500 mt-1">Natural human conversation with zero awkward pauses</p>
        </div>

        <div className="luxury-card rounded-2xl p-6 text-center border border-slate-200/90 shadow-xs">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
            100%
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-1">Floor Price Protection</h4>
          <p className="text-xs text-slate-500 mt-1">Strict adherence to landlord concession boundaries</p>
        </div>
      </div>

      {/* Priority Pilot Registration Form */}
      <div className="max-w-2xl mx-auto luxury-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 bg-white/95">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Priority Agency Pilot Program</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Deploy Kyron for Your Property Portfolio
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Join forward-thinking brokerages and property management teams launching 24/7 Voice AI associates.
              </p>
            </div>

            {/* Role & Portfolio Selector */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Primary Role:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Broker / Agent", "Property Manager", "Landlord / Investor"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                        role === r
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Portfolio Size:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["1 - 10 Units", "11 - 50 Units", "50+ Units"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPortfolioSize(s)}
                      className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
                        portfolioSize === s
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Email Input & Submit */}
            <div className="space-y-2 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your work email address"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50/90 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Early Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            </div>

            {/* Perks & Trust Badges */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Zero spam. Instant access link upon invite.
              </span>
              <span className="font-semibold text-blue-600">
                🎁 Includes 6 Months Free AI Voice Concierge
              </span>
            </div>
          </form>
        ) : (
          <div className="py-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Priority Pilot Spot Confirmed!
            </h3>
            <p className="text-sm text-slate-600 mt-1 max-w-sm">
              We&apos;ve reserved your priority agency access for <strong className="text-slate-900 font-semibold">{email}</strong> ({role} • {portfolioSize}).
            </p>
            <div className="mt-4 p-3.5 bg-blue-50/90 border border-blue-100 rounded-xl text-xs text-blue-900 max-w-md text-left">
              ✨ <strong>Next Steps:</strong> You can start exploring the <strong>60-Second Property Onboarding Studio</strong> right now in the demo workspace below.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/properties/new"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-xs"
              >
                Launch Onboarding Studio
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEmail("");
                  setSubmitted(false);
                }}
                className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                Register another team member
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
