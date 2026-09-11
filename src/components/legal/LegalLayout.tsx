import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

/**
 * Shared shell for the public legal pages (/privacy, /terms).
 *
 * These routes must stay reachable without a session: Google's OAuth verification
 * reviewer fetches the privacy policy URL unauthenticated before approving the
 * Calendar scopes. Never place these behind an auth guard.
 */
export function LegalLayout({
  title,
  subtitle,
  effectiveDate,
  children,
}: {
  title: string;
  subtitle: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-lg bg-blue-600 p-1.5 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800 group-hover:text-blue-700">
              Kyron Realty AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/listings"
              className="text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
            >
              Explore Listings
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base text-slate-600">{subtitle}</p>
        <p className="mt-4 text-xs text-slate-500">
          Effective date: <span className="font-medium text-slate-700">{effectiveDate}</span>
        </p>

        <div className="mt-10 space-y-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/70 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>&copy; {new Date().getFullYear()} Egnitech. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/listings" className="hover:text-blue-700 font-medium">
              Explore Listings
            </Link>
            <Link href="/privacy" className="hover:text-blue-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** A numbered top-level clause. */
export function Clause({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-900">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

/** Callout for the clauses a reader must not skim past. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm leading-relaxed text-slate-800">
      {children}
    </div>
  );
}
