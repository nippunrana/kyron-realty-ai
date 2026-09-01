import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  BrainCircuit,
  TrendingUp,
  Target,
  Sparkles,
  Building2,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Layers,
  Database,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Kyron Realty AI",
  description: "Your AI real estate intelligence workspace and automated property valuation pipeline.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const firstName = (user.name || user.email?.split("@")[0] || "there").split(" ")[0];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Ambient Luxury Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] luxury-gradient pointer-events-none -z-10" />

      {/* Top Header */}
      <DashboardHeader user={user} />

      {/* Main Dashboard Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Banner */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Private Beta Active • Pro Intelligence Tier</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Your AI real estate intelligence hub. Monitor automated property valuations, market yields, and deal matchmaking pipelines.
              </p>
            </div>

            {/* Quick Status / Engine Metric */}
            <div className="flex items-center gap-3">
              <div className="luxury-card px-4 py-2.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    AI Engine Status
                  </div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Online & Synchronized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Empty State Workspace Modules */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module Card 1 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  <span>Pipeline Initializing</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                AI Valuations & Comps
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated ML valuation engine with confidence intervals, instant comparable analysis, and micro-appreciation drivers.
              </p>

              {/* Module Placeholder Visual */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center text-center justify-center py-6">
                <Database className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">No active valuations yet</span>
                <span className="text-[11px] text-slate-500 mt-0.5">MLS ingestion will sync with your account shortly.</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Predictive precision: <strong className="text-slate-800 font-semibold">98.4%</strong></span>
              <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                Beta Q2
              </span>
            </div>
          </div>

          {/* Module Card 2 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Radar Ready</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Growth & Yield Radar
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Micro-market price appreciation momentum, cap rate trajectories, and neighborhood zoning updates.
              </p>

              {/* Module Placeholder Visual */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center text-center justify-center py-6">
                <Layers className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Market Radar Standby</span>
                <span className="text-[11px] text-slate-500 mt-0.5">50,000+ zipcodes will populate during beta rollout.</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Coverage: <strong className="text-slate-800 font-semibold">50k+ Zipcodes</strong></span>
              <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                Beta Q2
              </span>
            </div>
          </div>

          {/* Module Card 3 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Algorithmic</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Deal Matchmaker
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect your acquisition criteria directly with off-market and pre-market opportunities with sub-second matching.
              </p>

              {/* Module Placeholder Visual */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center text-center justify-center py-6">
                <Building2 className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">No active matches</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Configure your buy box preferences upon launch.</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Match latency: <strong className="text-slate-800 font-semibold">&lt; 100ms</strong></span>
              <span className="text-slate-700 font-semibold flex items-center gap-0.5">
                Beta Q2
              </span>
            </div>
          </div>
        </section>

        {/* Quick Launchpad & Info Card */}
        <section className="mt-8">
          <div className="luxury-card rounded-2xl p-6 sm:p-7 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Priority Access Granted
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 max-w-xl">
                  You are registered under account <strong className="font-semibold text-slate-800">{user.email}</strong>. As an early adopter, you have 6 months of VIP AI Intelligence Tier credited upon public beta activation.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors whitespace-nowrap"
            >
              <span>View Platform Overview</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Kyron Realty AI</span>
            <span>— Next-Gen Intelligence Workspace</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <span>•</span>
            <span>&copy; {new Date().getFullYear()} Kyron Realty AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
