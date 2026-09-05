import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { desc } from "drizzle-orm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  BrainCircuit,
  TrendingUp,
  Target,
  Sparkles,
  Building2,
  ShieldCheck,
  Plus,
  PhoneCall,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Radio,
  ExternalLink,
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

  // Fetch active properties
  let userProperties: any[] = [];
  try {
    userProperties = await db
      .select()
      .from(properties)
      .orderBy(desc(properties.createdAt));
  } catch (err) {
    console.error("Error fetching properties for dashboard:", err);
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Ambient Luxury Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] luxury-gradient pointer-events-none -z-10" />

      {/* Top Header */}
      <DashboardHeader user={user} />

      {/* Main Dashboard Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome & Action Banner */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Agora SD-RTN Voice Engine Active • Pro Tier</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage your real estate listings, monitor 24/7 AI voice sales agents, and track qualified buyer leads.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Property Listing</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Active Property Inventory Section */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Active Listings & Voice Agents</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  {userProperties.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every listing is deployed with real-time Agora speech intelligence and dynamic price guardrails.
              </p>
            </div>

            {userProperties.length > 0 && (
              <Link
                href="/dashboard/properties/new"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>+ Add another listing</span>
              </Link>
            )}
          </div>

          {userProperties.length === 0 ? (
            /* Zero State Card */
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                No Properties Listed Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
                Launch your first property in under 60 seconds. Paste an existing URL to scrape specs, or talk with our voice wizard to synthesize a verified knowledge base.
              </p>
              <Link
                href="/dashboard/properties/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Onboarding Studio</span>
              </Link>
            </div>
          ) : (
            /* Property Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProperties.map((prop) => {
                const coverImage =
                  prop.coverImageUrl ||
                  (Array.isArray(prop.images) && prop.images[0]) ||
                  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-16/10 bg-slate-900 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                            {prop.listingType === "rent" ? "For Rent" : "For Sale"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/90 text-white text-[10px] font-bold uppercase">
                            {prop.propertyType}
                          </span>
                        </div>

                        {/* Agora Voice Active Pill */}
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                            <Radio className="w-3 h-3 animate-pulse text-emerald-300" />
                            <span>Voice AI Live</span>
                          </span>
                        </div>

                        {/* Price Overlay */}
                        <div className="absolute bottom-3 left-3 text-white">
                          <div className="text-lg font-extrabold tracking-tight">
                            ${Number(prop.price).toLocaleString()}
                            {prop.listingType === "rent" && (
                              <span className="text-xs font-normal text-slate-200">/mo</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5">
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">
                            {prop.address}, {prop.city}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 mb-3">
                          {prop.title}
                        </h3>

                        {/* Specs Pill Row */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 pb-3 border-b border-slate-100 font-medium">
                          <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.bedrooms || 2} Beds</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.bathrooms || 2} Baths</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Maximize className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.sqft || 1000} sf</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/listings/${prop.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Test Voice Agent</span>
                      </Link>

                      <Link
                        href={`/listings/${prop.slug}`}
                        target="_blank"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Open Public Listing in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Intelligence Platform Modules */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Agora Voice Ready</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Voice Ingestion & RAG
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Agora Conversational AI Cloud Gateway connects buyers directly with property knowledge bases and concession guardrails.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Voice Roundtrip: <strong className="text-slate-800 font-semibold">&lt; 300ms</strong></span>
              <span className="text-blue-600 font-semibold">Active</span>
            </div>
          </div>

          {/* Module 2 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Apify Crawler</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Universal URL Scraper
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Extract specs, photo galleries, and amenities from any landlord or broker URL in under 30 seconds.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Parse Accuracy: <strong className="text-slate-800 font-semibold">99.8%</strong></span>
              <span className="text-indigo-600 font-semibold">Active</span>
            </div>
          </div>

          {/* Module 3 */}
          <div className="luxury-card luxury-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200/80 bg-white/90">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Concession Engine</span>
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Exchange-of-Value Matrix
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dynamic negotiation guardrails ensure the AI never compromises your floor price while closing high-intent deals.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Floor Protection: <strong className="text-slate-800 font-semibold">100% Locked</strong></span>
              <span className="text-emerald-600 font-semibold">Active</span>
            </div>
          </div>
        </section>
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Kyron Realty AI</span>
            <span>— Voice-First Real Estate Intelligence</span>
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
