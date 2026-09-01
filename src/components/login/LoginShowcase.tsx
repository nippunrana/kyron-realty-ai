import Image from "next/image";
import { Sparkles, Zap, Star, TrendingUp } from "lucide-react";

export function LoginShowcase() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden bg-slate-950 text-white min-h-screen select-none">
      {/* High-Resolution Luxury Architectural Image Background */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/luxury-architecture-twilight.jpg"
          alt="Luxury Architecture at Twilight"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center opacity-40 scale-105"
        />
        {/* Multi-layered dark gradient overlays for cinematic contrast & readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/90" />
      </div>

      {/* Atmospheric Ambient Glowing Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none -z-10" />

      {/* Top Feature Tag & Version */}
      <div className="flex items-center justify-between relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/15 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          <span>Kyron Intelligence Cloud™</span>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          v1.0 Institutional Edition
        </span>
      </div>

      {/* Central Showcase Cards */}
      <div className="my-auto py-8 space-y-5 max-w-lg relative z-10">
        <div className="space-y-2.5">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Predictive valuation intelligence for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
              high-conviction dealmakers
            </span>
            .
          </h2>
          <p className="text-xs xl:text-sm text-slate-300 leading-relaxed font-normal">
            Synthesizing millions of live property comps, macroeconomic signals, and spatial growth vectors in real time.
          </p>
        </div>

        {/* Card 1: Live Property Valuation Snapshot */}
        <div className="luxury-dark-card luxury-dark-card-hover p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3.5">
            <span className="px-2.5 py-1 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3 h-3 text-blue-400" aria-hidden="true" /> Live Valuation
            </span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              98.4% Confidence
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3.5">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Bel Air Modern Villa
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Los Angeles, CA 90077</p>
            </div>
            <div className="text-right">
              <div className="text-lg xl:text-xl font-extrabold text-white">
                $8,450,000
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                +14.2% Projected 3-Yr
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-white/[0.04] border border-white/[0.06] p-2 rounded-xl">
              <div className="text-slate-400 font-medium">Cap Rate</div>
              <div className="font-bold text-white mt-0.5">6.8%</div>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] p-2 rounded-xl">
              <div className="text-slate-400 font-medium">Growth Score</div>
              <div className="font-bold text-blue-400 mt-0.5">94 / 100</div>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] p-2 rounded-xl">
              <div className="text-slate-400 font-medium">Comps Match</div>
              <div className="font-bold text-white mt-0.5">18 Verified</div>
            </div>
          </div>
        </div>

        {/* Card 2: Market Velocity & Testimonial */}
        <div className="luxury-dark-card luxury-dark-card-hover p-5 rounded-2xl">
          <div className="flex items-center gap-1 text-amber-400 mb-2.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>
          <p className="text-xs xl:text-sm text-slate-200 italic leading-relaxed">
            &ldquo;Kyron gives our acquisitions team an unfair advantage in identifying undervalued off-market assets before the broader market catches on.&rdquo;
          </p>
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-white">Marcus Vance</span>
              <span className="text-slate-400"> — Principal, Vance Capital</span>
            </div>
            <span className="text-blue-300 bg-blue-500/15 border border-blue-400/25 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-400" aria-hidden="true" /> $42M Deployed
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Platform Metrics Strip */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-center relative z-10">
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="text-lg xl:text-xl font-extrabold text-white">0.4s</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Inference Latency</div>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="text-lg xl:text-xl font-extrabold text-white">50k+</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Zipcodes Indexed</div>
        </div>
        <div className="p-2 rounded-xl bg-white/[0.02]">
          <div className="text-lg xl:text-xl font-extrabold text-white">$1.2B+</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Analyzed Pipeline</div>
        </div>
      </div>
    </div>
  );
}
