"use client";

import Link from "next/link";
import {
  Home,
  Building,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/**
 * Persona split. Each card names the pain in the reader's own words first,
 * then the change — every "change" line maps to something that is actually built.
 */

interface Persona {
  id: string;
  icon: typeof Home;
  audience: string;
  headline: string;
  pain: string;
  changes: string[];
  cta: { label: string; href: string } | null;
  accent: string;
  iconClass: string;
}

const PERSONAS: Persona[] = [
  {
    id: "owners",
    icon: Home,
    audience: "Owners & landlords",
    headline: "You own the flat. You never signed up to be its marketing department.",
    pain: "Listing it means a long form, photos trapped on your phone, and an hour of looking up what is nearby and how far it really is.",
    changes: [
      "Talk it through once — it asks, you answer, it writes the listing",
      "Nearby schools, transit and hospitals are found and timed for you",
      "Scan a code and shoot the photos from your phone, mid-conversation",
      "Live page, shareable link and a printable sign code in one go",
    ],
    cta: { label: "List a property by talking", href: "/dashboard/properties/new" },
    accent: "border-blue-500/70 shadow-lg shadow-blue-500/10",
    iconClass: "bg-blue-600 text-white",
  },
  {
    id: "teams",
    icon: Building,
    audience: "Brokerages & property managers",
    headline: "Your team cannot answer every call. It should not have to.",
    pain: "Coordinators burn their day repeating the same five answers, and the calls that arrive after 7pm simply never get answered at all.",
    changes: [
      "Every enquiry answered on the first ring, every night and weekend",
      "Negotiates within limits you set — your floor price is never revealed",
      "Books viewings straight into your calendar without exposing it",
      "Rings your manager's phone and bridges them into the live call",
    ],
    cta: { label: "See the handover in action", href: "#live-human" },
    accent: "border-slate-300",
    iconClass: "bg-slate-900 text-white",
  },
  {
    id: "buyers",
    icon: Search,
    audience: "Buyers & renters",
    headline: "You just want a straight answer before you drive across town.",
    pain: "Listings say \"prime location\" and nobody picks up to tell you what that means, whether pets are allowed, or when you could see it.",
    changes: [
      "Say what you're looking for out loud and watch matches appear",
      "Distances in minutes from that exact door, not adjectives",
      "An honest yes or no on your budget instead of a runaround",
      "Ask for a person and get one on the call, not a callback promise",
    ],
    cta: { label: "Browse live listings", href: "/listings" },
    accent: "border-slate-200",
    iconClass: "bg-indigo-600 text-white",
  },
];

export function WhoItIsFor() {
  return (
    <section id="who-its-for" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 border-t border-slate-200/80">
      {/* Section header */}
      <div className="max-w-3xl mb-12 md:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Three people, one conversation</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Built for the person who lists it, the team who sells it, and the buyer who calls at
          midnight.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          return (
            <article
              key={persona.id}
              className={`luxury-card luxury-card-hover rounded-2xl p-6 sm:p-7 flex flex-col border ${persona.accent}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${persona.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {persona.audience}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900 leading-snug">
                {persona.headline}
              </h3>

              <p className="mt-3 text-sm text-slate-500 leading-relaxed">{persona.pain}</p>

              <div className="mt-6 pt-5 border-t border-slate-100 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  What changes
                </span>
                <ul className="mt-3 space-y-2.5">
                  {persona.changes.map((change) => (
                    <li key={change} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {persona.cta && (
                <Link
                  href={persona.cta.href}
                  className="mt-7 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span>{persona.cta.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
