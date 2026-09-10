"use client";
// TEMPORARY diagnostic route - deleted at the end of this task.
import { OnboardingStudio } from "@/components/dashboard/onboarding/OnboardingStudio";

export default function ScratchIntroPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <div className="h-16 border-b bg-white shrink-0 flex items-center px-6 font-bold">Header</div>
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <OnboardingStudio user={{ name: "Nippun Rana", email: "owner@example.com" }} />
      </main>
    </div>
  );
}
