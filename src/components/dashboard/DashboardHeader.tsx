"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Building2, LogOut, Loader2, Sparkles } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: `${BASE_PATH}/login` });
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KR";

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Workspace Label */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group"
            aria-label="Kyron Realty AI Dashboard"
          >
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Kyron Realty
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                AI
              </span>
            </div>
          </Link>

          <span className="hidden md:inline-block text-slate-300 text-sm">/</span>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Intelligence Workspace
          </span>
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l sm:border-l-0 border-slate-200">
            {/* User Avatar */}
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm"
                aria-hidden="true"
              >
                {initials}
              </div>
            )}

            {/* Name and Email (Hidden on small mobile) */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {displayName}
              </span>
              {displayEmail && (
                <span className="text-[11px] text-slate-500 truncate max-w-[160px] leading-tight mt-0.5">
                  {displayEmail}
                </span>
              )}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sign out of Kyron Realty AI"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" aria-hidden="true" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
