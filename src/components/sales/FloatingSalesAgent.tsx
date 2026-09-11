"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BASE_PATH } from "@/lib/base-path";
import {
  Sparkles,
  X,
  Compass,
  Search,
  Mic,
  ChevronDown,
  MessageSquare,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface PageContextInfo {
  pageTitle: string;
  category: string;
  hint: string;
  suggestedPrompts: string[];
  isStudio: boolean;
}

/**
 * Derives contextual real estate insights based on current route
 */
function getPageContext(pathname: string): PageContextInfo {
  if (pathname.includes("/dashboard/properties/new")) {
    return {
      pageTitle: "Property Onboarding Studio",
      category: "Intake Active",
      hint: "Elena Vance is currently guiding you through property onboarding. I am on standby to avoid audio crossover.",
      suggestedPrompts: ["How do I verify parking?", "What happens after deploy?"],
      isStudio: true,
    };
  }

  if (pathname.startsWith("/dashboard")) {
    return {
      pageTitle: "Owner Dashboard",
      category: "Portfolio Management",
      hint: "Reviewing your active properties, lead inquiries, and occupancy metrics.",
      suggestedPrompts: [
        "How many active leads this week?",
        "Which listing has the highest interest?",
      ],
      isStudio: false,
    };
  }

  if (pathname.startsWith("/listings/")) {
    const slug = pathname.replace(/^\/listings\//, "").split("/")[0];
    const formattedSlug = slug
      ? slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "Property Listing";

    return {
      pageTitle: formattedSlug,
      category: "Property Detail",
      hint: "Ask me anything about this property's floor plan, HOA rules, negotiable concessions, or schedule an in-person tour.",
      suggestedPrompts: [
        "Is the monthly rent negotiable?",
        "What are the parking and pet policies?",
        "Schedule a private viewing tour",
      ],
      isStudio: false,
    };
  }

  if (pathname.startsWith("/listings")) {
    return {
      pageTitle: "All Active Listings",
      category: "Property Directory",
      hint: "Browsing all verified residential and commercial properties in our portfolio.",
      suggestedPrompts: [
        "Find 3BHK flats under ₹1.5 Cr",
        "Show luxury villas with private garden",
        "Commercial office spaces in Cyber Hub",
      ],
      isStudio: false,
    };
  }

  if (pathname.startsWith("/login")) {
    return {
      pageTitle: "Client Authentication",
      category: "Account Access",
      hint: "Sign in to manage your listings, access owner intelligence, or manage scheduled viewings.",
      suggestedPrompts: ["How does Google login work?", "Where can I register as an owner?"],
      isStudio: false,
    };
  }

  if (pathname.startsWith("/privacy") || pathname.startsWith("/terms")) {
    return {
      pageTitle: "Legal & Terms",
      category: "Compliance",
      hint: "Kyron Realty AI privacy policies, data protections, and terms of service.",
      suggestedPrompts: ["How is voice data processed?", "What are the tenant terms?"],
      isStudio: false,
    };
  }

  // Default: Homepage
  return {
    pageTitle: "Home & Showcase",
    category: "Main Portal",
    hint: "Welcome to Kyron Realty AI! I'm Sarah, your autonomous sales & leasing associate. How can I help you find your dream property?",
    suggestedPrompts: [
      "Show me top luxury apartments",
      "Which properties are available immediately?",
      "How does the AI sales assistant work?",
    ],
    isStudio: false,
  };
}

export function FloatingSalesAgent() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const context = useMemo(() => getPageContext(pathname || "/"), [pathname]);

  const avatarUrl = `${BASE_PATH}/images/sarah-sales-agent.jpg`;

  const handlePromptClick = (prompt: string) => {
    setActiveFeedback(`"${prompt}" — Sales Brain coming in next step! I'll query our database and reply via voice.`);
    setTimeout(() => {
      setActiveFeedback(null);
    }, 4500);
  };

  // When on onboarding studio, stay minimally collapsed to avoid overlapping Elena Vance's studio
  if (context.isStudio && !isOpen) {
    return (
      <aside
        aria-label="Sales Agent Standby"
        className="fixed bottom-4 right-4 z-30 opacity-75 hover:opacity-100 transition-opacity"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur-md cursor-pointer hover:border-slate-500"
          title="Sarah (Sales AI) is in standby while Elena Vance guides onboarding"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Sarah • Standby</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Kyron Sales Agent Widget"
      className="fixed bottom-5 right-5 z-40 select-none font-sans"
    >
      {/* ========================================================================= */}
      {/* EXPANDED POPOVER CARD                                                     */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[380px] max-w-[400px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl shadow-blue-950/40 backdrop-blur-2xl text-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Card Top Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-blue-500/30 shrink-0">
                <Image
                  src={avatarUrl}
                  alt="Sarah AI Sales Advisor"
                  fill
                  sizes="44px"
                  unoptimized={true}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">Sarah</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  AI Sales &amp; Leasing Associate
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close sales assistant preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Page Awareness Badge */}
          <div className="px-5 pt-4 pb-2">
            <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/30 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Live Page Context
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-900/40 text-blue-200 border border-blue-700/30 truncate max-w-[120px]">
                    {context.category}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                  {context.pageTitle}
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {context.hint}
                </p>
              </div>
            </div>
          </div>

          {/* Core Capabilities Preview */}
          <div className="px-5 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Sales Agent Superpowers</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-0.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>DB Search</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Instant search across all properties &amp; prices
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-0.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>&lt;300ms Voice</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Conversational negotiation via Agora SD-RTN
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Prompt Chips */}
          <div className="px-5 py-2">
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Suggested Inquiries:</span>
              <span className="text-[10px] text-slate-500 font-mono">Try clicking</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {context.suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all duration-150 flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">{prompt}</span>
                  <MessageSquare className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>

            {/* Prompt Feedback Alert */}
            {activeFeedback && (
              <div className="mt-2 p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-200 animate-in fade-in duration-150 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{activeFeedback}</span>
              </div>
            )}
          </div>

          {/* Bottom Action Footer (Prep for Brain) */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="truncate text-[11px]">Brain coming up in next step...</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Minimize agent"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTING FLOATING PILL                                                     */}
      {/* ========================================================================= */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="group relative flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-white shadow-xl shadow-slate-950/50 hover:shadow-blue-500/20 backdrop-blur-xl transition-all duration-300 cursor-pointer"
      >
        {/* Avatar with Live Indicator */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/40 group-hover:ring-blue-400 transition-all shrink-0">
          <Image
            src={avatarUrl}
            alt="Sarah AI Sales Advisor"
            fill
            sizes="36px"
            unoptimized={true}
            className="object-cover"
          />
          {/* Pulsing online badge */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
        </div>

        {/* Info Text */}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors">
              Sarah
            </span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              • Sales Advisor
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-300/90 font-mono truncate max-w-[130px] sm:max-w-[170px]">
              {context.pageTitle}
            </span>
          </div>
        </div>

        {/* Subtle Toggle Hint */}
        <div className="ml-1 text-slate-500 group-hover:text-slate-300 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </div>
    </aside>
  );
}
