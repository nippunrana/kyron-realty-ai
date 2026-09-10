import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties, voiceSessions } from "@/db/schema";
import { desc, eq, inArray, isNull, or } from "drizzle-orm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PropertyListingsSection, type ListingCardItem } from "@/components/dashboard/PropertyListingsSection";
import { DashboardUsageWidget } from "@/components/dashboard/DashboardUsageWidget";
import type { DashboardUsageStats, SessionHistoryItem } from "@/components/dashboard/usage-types";
import { backfillUnsyncedSessions } from "@/lib/agora-telemetry";
import {
  BrainCircuit,
  Target,
  Sparkles,
  Building2,
  ShieldCheck,
  Plus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard | Kyron Realty AI",
  description: "Your AI real estate intelligence workspace and automated property valuation pipeline.",
};

// Only the columns the cards render: each row's stored QR SVG alone would dwarf the rest.
const listingCardColumns = {
  id: properties.id,
  slug: properties.slug,
  title: properties.title,
  address: properties.address,
  city: properties.city,
  listingType: properties.listingType,
  propertyType: properties.propertyType,
  price: properties.price,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  sqft: properties.sqft,
  coverImageUrl: properties.coverImageUrl,
  images: properties.images,
  status: properties.status,
  knowledgeBase: properties.knowledgeBase,
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const firstName = (user.name || user.email?.split("@")[0] || "there").split(" ")[0];

  // Own listings only. Rows with a null owner_id predate authentication and stay
  // visible to every user until they are assigned (see docs/built-systems/database.md).
  let userProperties: (ListingCardItem & { knowledgeBase?: any })[] = [];
  try {
    userProperties = await db
      .select(listingCardColumns)
      .from(properties)
      .where(or(eq(properties.ownerId, user.id ?? ""), isNull(properties.ownerId)))
      .orderBy(desc(properties.createdAt));
  } catch (err) {
    console.error("Error fetching properties for dashboard:", err);
  }

  // Auto-sync any unbackfilled sessions with Agora Cloud Gateway
  try {
    await backfillUnsyncedSessions();
  } catch (syncErr) {
    console.warn("[Agora Telemetry] Backfill check warning:", syncErr);
  }

  // Fetch Voice Sessions associated with the user or their properties
  let userSessions: any[] = [];
  try {
    const userPropertyIds = userProperties.map((p) => p.id).filter(Boolean);
    const sessionConditions = [
      eq(voiceSessions.callerIdentifier, user.id ?? ""),
    ];
    if (user.email) {
      sessionConditions.push(eq(voiceSessions.callerIdentifier, `user-${user.email}`));
    }
    if (userPropertyIds.length > 0) {
      sessionConditions.push(inArray(voiceSessions.propertyId, userPropertyIds));
    }

    userSessions = await db
      .select()
      .from(voiceSessions)
      .where(or(...sessionConditions))
      .orderBy(desc(voiceSessions.startedAt));
  } catch (err) {
    console.error("Error fetching voice sessions for dashboard:", err);
  }

  // Pre-calculate session history items
  const propertyMap = new Map(userProperties.map((p) => [p.id, p]));

  const recentSessions: SessionHistoryItem[] = userSessions.map((sess) => {
    const prop = sess.propertyId ? propertyMap.get(sess.propertyId) : null;
    const durSec = sess.durationSeconds || 0;
    const durMins = (durSec / 60).toFixed(1);
    const m = Math.floor(durSec / 60);
    const s = durSec % 60;
    const durationFormatted = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

    let mapsSummary: string | null = null;
    if (prop?.knowledgeBase?.kbData) {
      const kbData = prop.knowledgeBase.kbData;
      const elemCount = (kbData.nearbyDistances?.length || 0) * 2;
      const queryCount = kbData.grounded ? 4 : 0;
      if (elemCount > 0 || queryCount > 0) {
        mapsSummary = `${elemCount} elem • ${queryCount} queries`;
      }
    }

    const startedDate = sess.startedAt ? new Date(sess.startedAt) : new Date();
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(startedDate) + " UTC";

    return {
      id: sess.id,
      propertyId: sess.propertyId,
      propertyTitle: prop?.title || (sess.callerType === "owner_onboarding" ? "Property Voice Onboarding" : "Buyer Inquiry Call"),
      propertySlug: prop?.slug || null,
      isDraft: prop ? prop.status === "draft" : (sess.callerType === "owner_onboarding"),
      callerType: sess.callerType || "buyer_inquiry",
      durationSeconds: durSec,
      durationFormatted,
      durationMinutes: durMins,
      mapsUsageSummary: mapsSummary,
      startedAt: startedDate.toISOString(),
      formattedDate,
      status: sess.status || "completed",
      isAgoraVerified: Boolean(sess.agoraSessionId && (durSec > 0 || sess.status === "completed")),
    };
  });

  // Aggregate executive metrics for DashboardUsageStats
  const totalDurationSeconds = userSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalConvoMinutes = Number((totalDurationSeconds / 60).toFixed(1));
  const convoFreeTierLimit = 300;
  const convoPercentage = Math.min(100, Math.round((totalConvoMinutes / convoFreeTierLimit) * 100));
  const convoMinutesRemaining = Math.max(0, Number((convoFreeTierLimit - totalConvoMinutes).toFixed(1)));
  const convoOverageMinutes = Math.max(0, Number((totalConvoMinutes - convoFreeTierLimit).toFixed(1)));

  let totalRoutesElements = 0;
  let totalGroundingQueries = 0;
  for (const prop of userProperties) {
    if (prop.knowledgeBase?.kbData) {
      const kbData = prop.knowledgeBase.kbData;
      const distLen = kbData.nearbyDistances?.length || 0;
      totalRoutesElements += distLen * 2;
      if (kbData.grounded) {
        totalGroundingQueries += 4;
      }
    }
  }

  const overageMinutes = Math.max(0, totalConvoMinutes - convoFreeTierLimit);
  const estimatedSpendUsd = Number((overageMinutes * 0.10).toFixed(2));

  const usageStats: DashboardUsageStats = {
    totalConvoMinutes,
    convoMinutesFormatted: totalConvoMinutes.toString(),
    convoFreeTierLimit,
    convoMinutesRemaining,
    convoOverageMinutes,
    convoPercentage,
    totalVoiceSessions: userSessions.length,
    onboardingSessionsCount: userSessions.filter((s) => s.callerType === "owner_onboarding").length,
    buyerSessionsCount: userSessions.filter((s) => s.callerType === "buyer_inquiry").length,
    totalRoutesElements,
    routesFreeTierLimit: 70000,
    totalGroundingQueries,
    groundingFreeTierLimit: 5000,
    estimatedSpendUsd,
    isFreeTierActive: overageMinutes === 0,
    draftsCount: userProperties.filter((p) => p.status === "draft").length,
    publishedCount: userProperties.filter((p) => p.status !== "draft").length,
  };

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

        {/* AI Telemetry, Credit & Usage Widget */}
        <DashboardUsageWidget stats={usageStats} sessions={recentSessions} />

        {/* Property Inventory Section (Published vs Drafts Tabs + Deletion) */}
        <PropertyListingsSection initialProperties={userProperties} />

        {/* Intelligence Platform Modules */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
