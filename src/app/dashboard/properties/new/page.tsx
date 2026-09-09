import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OnboardingStudio } from "@/components/dashboard/onboarding/OnboardingStudio";

export const metadata: Metadata = {
  title: "New Property Onboarding Studio | Kyron Realty AI",
  description: "AI-powered property listing creation and Agora Voice Agent deployment.",
};

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const initialDraftId = resolvedParams.draftId ? Number(resolvedParams.draftId) : undefined;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Ambient Light Luxury Glow */}
      <div className="absolute top-0 inset-x-0 h-[400px] luxury-gradient pointer-events-none -z-10" />

      {/* Top Header */}
      <DashboardHeader user={session.user} />

      {/* Main Studio Workspace */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <OnboardingStudio user={session.user} initialDraftId={initialDraftId} />
      </main>
    </div>
  );
}
