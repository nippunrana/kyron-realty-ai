import Link from "next/link";
import { Building2, Radio } from "lucide-react";

export function PublicListingFooter() {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 tracking-tight">Kyron Realty AI</span>
            <span className="hidden md:inline text-slate-400"> — 24/7 Autonomous Voice AI for High-Ticket Real Estate</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/listings" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Explore All Listings
          </Link>
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">
            Terms of Service
          </Link>
          <span className="hidden lg:flex items-center gap-1 text-slate-400">
            <Radio className="w-3 h-3 text-emerald-500" />
            Agora SD-RTN
          </span>
          <span>&copy; {new Date().getFullYear()} Kyron Realty AI.</span>
        </div>
      </div>
    </footer>
  );
}
