"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Target,
  CheckCircle2,
  ArrowRight,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Investor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    // Simulate instant client-side submission with realistic response delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setEmail("");
    setSubmitted(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      {/* Subtle Luxury Ambient Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] luxury-gradient pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Agora Realty
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              AI
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Private Beta Launch Q2 2026
          </span>
          <Link
            href="/login"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-all"
          >
            Sign In
          </Link>
          <a
            href="#waitlist"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all"
          >
            Get Early Access
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        {/* Social Proof Counter Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 text-xs font-medium mb-8 shadow-sm">
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-gradient-to-tr from-blue-600 to-indigo-500" />
            <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-gradient-to-tr from-indigo-500 to-purple-500" />
            <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-500 to-pink-500" />
          </div>
          <span className="text-slate-600">
            Join <strong className="text-slate-900 font-semibold">540+</strong> real estate investors & brokers
          </span>
          <span className="text-blue-600">→</span>
        </div>

        {/* Hero Headline */}
        <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-center text-slate-900 leading-[1.15]">
          The AI Intelligence Layer for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            Modern Real Estate
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-2xl text-center text-base sm:text-lg text-slate-600 leading-relaxed">
          Instant algorithmic property valuations, predictive neighborhood yield forecasting, and intelligent deal matching — designed for high-conviction investors and forward-thinking brokers.
        </p>

        {/* Waitlist Capture Card */}
        <section id="waitlist" className="mt-10 w-full max-w-xl">
          <div className="luxury-card p-6 sm:p-8 rounded-2xl">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Reserve your priority access spot
                  </span>
                  <div className="flex gap-2">
                    {["Investor", "Broker", "Buyer"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                          role === r
                            ? "bg-blue-100 text-blue-800 font-medium"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

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
                      placeholder="Enter your work or personal email"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Securing...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Early Access</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Zero spam. Unsubscribe anytime.
                  </span>
                  <span className="font-medium text-blue-600">
                    🎁 First 100 signups get 6mo Free Pro Tier
                  </span>
                </div>
              </form>
            ) : (
              <div className="py-4 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  You&apos;re on the priority waitlist!
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-sm">
                  We&apos;ve reserved spot <strong className="text-slate-900 font-semibold">#541</strong> for{" "}
                  <span className="font-medium text-blue-600">{email}</span> ({role}).
                </p>
                <div className="mt-4 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 max-w-md">
                  ✨ <strong>Early-Bird Perk Unlocked:</strong> 6 months of VIP AI Intelligence Tier will be credited to your account upon launch.
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-5 text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
                >
                  Register another email
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Feature Teasers (3-Column Cards) */}
        <section className="mt-20 w-full">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Core Capabilities
            </h2>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Engineered for smarter real estate decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="luxury-card luxury-card-hover p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Instant AI Valuations
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Sub-second automated property valuations with confidence intervals, instant comp analysis, and granular appreciation drivers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-600">
                <span>Predictive accuracy</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">98.4%</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="luxury-card luxury-card-hover p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Growth & Yield Radar
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Forecast micro-market price momentum, rental cap rates, and neighborhood development patterns 12 to 36 months ahead.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <span>Micro-market coverage</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">50k+ Zipcodes</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="luxury-card luxury-card-hover p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Smart Deal Matchmaker
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Algorithmic buyer-seller matchmaking that connects high-intent investors directly with verified on- and off-market opportunities.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>Matching speed</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">&lt; 100ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="mt-16 w-full luxury-card rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pt-2 sm:pt-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                0.4s
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Real-Time Valuation Speed
              </div>
            </div>
            <div className="pt-4 sm:pt-0 sm:pl-6">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                98.4%
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Historical Valuation Precision
              </div>
            </div>
            <div className="pt-4 sm:pt-0 sm:pl-6">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                $1.2B+
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">
                Indexed Property Value
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Agora Realty AI</span>
            <span>— Next-generation real estate intelligence.</span>
          </div>

          <div className="flex items-center gap-6">
            <span>&copy; {new Date().getFullYear()} Agora Realty AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

