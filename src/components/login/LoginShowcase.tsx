import { Sparkles, Zap, Star, TrendingUp } from "lucide-react";

export function LoginShowcase() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-100 border-l border-slate-200/80 relative overflow-hidden">
      {/* Subtle Luxury Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

      {/* Top Feature Tag */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Agora Intelligence Cloud™</span>
        </div>
        <span className="text-xs font-medium text-slate-500">v1.0 Institutional Edition</span>
      </div>

      {/* Central Showcase Cards */}
      <div className="my-auto py-8 space-y-5 max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Predictive valuation intelligence for high-conviction dealmakers.
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Synthesizing millions of live property comps, macroeconomic signals, and spatial growth vectors in real time.
          </p>
        </div>

        {/* Card 1: Live Property Valuation Snapshot */}
        <div className="luxury-card p-5 rounded-2xl shadow-sm border border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" aria-hidden="true" /> Live Valuation
            </span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              98.4% Confidence
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Bel Air Modern Villa
              </h4>
              <p className="text-xs text-slate-500">Los Angeles, CA 90077</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-slate-900">
                $8,450,000
              </div>
              <div className="text-[11px] font-semibold text-emerald-600">
                +14.2% Projected 3-Yr
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-slate-50/80 p-1.5 rounded-lg">
              <div className="text-slate-400 font-medium">Cap Rate</div>
              <div className="font-bold text-slate-800">6.8%</div>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded-lg">
              <div className="text-slate-400 font-medium">Growth Score</div>
              <div className="font-bold text-blue-600">94 / 100</div>
            </div>
            <div className="bg-slate-50/80 p-1.5 rounded-lg">
              <div className="text-slate-400 font-medium">Comps Match</div>
              <div className="font-bold text-slate-800">18 Verified</div>
            </div>
          </div>
        </div>

        {/* Card 2: Market Velocity & Testimonial */}
        <div className="luxury-card p-5 rounded-2xl shadow-sm border border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-1 text-amber-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>
          <p className="text-xs text-slate-700 italic leading-relaxed">
            &ldquo;Agora gives our acquisitions team an unfair advantage in identifying undervalued off-market assets before the broader market catches on.&rdquo;
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <div>
              <span className="font-bold text-slate-900">Marcus Vance</span>
              <span className="text-slate-500"> — Principal, Vance Capital</span>
            </div>
            <span className="text-blue-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" /> $42M Deployed
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Platform Metrics Strip */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/70 text-center">
        <div>
          <div className="text-lg font-extrabold text-slate-900">0.4s</div>
          <div className="text-[11px] text-slate-500 font-medium">Inference Latency</div>
        </div>
        <div>
          <div className="text-lg font-extrabold text-slate-900">50k+</div>
          <div className="text-[11px] text-slate-500 font-medium">Zipcodes Indexed</div>
        </div>
        <div>
          <div className="text-lg font-extrabold text-slate-900">$1.2B+</div>
          <div className="text-[11px] text-slate-500 font-medium">Analyzed Pipeline</div>
        </div>
      </div>
    </div>
  );
}
