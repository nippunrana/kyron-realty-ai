import { Building2, Brain, TrendingUp, ShieldCheck, Search, Sparkles, Cpu, Database, Server, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-between">
      {/* Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Agora Realty</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">AI</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#architecture" className="hover:text-white transition-colors">Stack & Architecture</a>
          <a href="#database" className="hover:text-white transition-colors">PostgreSQL 17</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/nippunrana/agora-realty-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-all border border-slate-700/60"
          >
            GitHub Repo
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full relative py-20 md:py-32 px-6 flex flex-col items-center text-center glow-gradient">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-8 shadow-inner">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Powered by Next.js 16 Standalone & PostgreSQL 17</span>
        </div>

        <h1 className="max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Next-Gen AI Intelligence for Modern <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Real Estate</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Deliver instant predictive valuations, automated property insights, and intelligent buyer-seller matching with sub-millisecond database queries.
        </p>

        {/* Search Mockup */}
        <div className="mt-10 w-full max-w-2xl">
          <div className="glass-card p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by neighborhood, city, address, or MLS ID..."
              className="flex-1 bg-transparent px-2 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
              defaultValue="Silicon Valley luxury residences & growth projections"
            />
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
              <span>Evaluate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl w-full">
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">99.8%</div>
            <div className="text-xs text-slate-400 mt-1">Valuation Accuracy</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">&lt; 15ms</div>
            <div className="text-xs text-slate-400 mt-1">Query Latency</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">Turbopack</div>
            <div className="text-xs text-slate-400 mt-1">Next.js 16 Default</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">Zero Downtime</div>
            <div className="text-xs text-slate-400 mt-1">PM2 + GitHub Actions</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/80">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Core Capabilities</h2>
          <p className="text-slate-400 mt-2">Built for speed, scalability, and deep real estate analytics.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Automated AI Valuations</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Synthesize historical comparables, market velocity, local school scores, and economic factors to generate highly calibrated pricing models.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Predictive Yield Forecasts</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Identify emerging neighborhood micro-trends and capital appreciation opportunities before standard MLS aggregation reports.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">Drizzle ORM & Postgres 17</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Fully type-safe SQL schemas with zero runtime overhead, optimized connection pooling, and sub-millisecond query execution.
            </p>
          </div>
        </div>
      </section>

      {/* Stack & Architecture Section */}
      <section id="architecture" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/80">
        <div className="glass-card p-8 md:p-12 rounded-3xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Production Architecture</span>
              <h2 className="text-3xl font-extrabold text-white mt-2">Engineered for VPS Performance</h2>
              <p className="text-slate-300 mt-4 leading-relaxed text-sm">
                Scaffolded with Next.js 16 standalone compilation, reducing production bundle memory to minimal levels and proxying through Nginx with zero-downtime PM2 process management.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <span>Next.js 16 (App Router + Turbopack + React 19)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span>PostgreSQL 17 + Drizzle ORM Type-Safe Schemas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <Server className="w-5 h-5 text-purple-400" />
                  <span>Nginx Reverse Proxy & PM2 Cluster Management</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-800 text-slate-500">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                <span className="ml-2 text-slate-400">deployment-status.log</span>
              </div>
              <div className="mt-4 space-y-2 text-slate-300">
                <p className="text-emerald-400">✔ GitHub Push: origin main</p>
                <p className="text-blue-400">⚡ GitHub Actions: build & test passed</p>
                <p className="text-indigo-400">📦 Deploy Hook: scripts/deploy.sh executed</p>
                <p className="text-slate-400">🔄 PM2 reload: agora-realty-ai (online)</p>
                <p className="text-emerald-300 font-semibold">🎉 Status: Production Ready & Active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Agora Realty AI. Synchronized with GitHub repository.</p>
      </footer>
    </main>
  );
}
