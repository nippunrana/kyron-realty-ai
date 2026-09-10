export interface SessionHistoryItem {
  id: number;
  propertyId: number | null;
  propertyTitle: string;
  propertySlug?: string | null;
  isDraft: boolean;
  callerType: "owner_onboarding" | "buyer_inquiry" | string;
  durationSeconds: number;
  durationFormatted: string;
  durationMinutes: string;
  mapsUsageSummary: string | null; // e.g. "12 elem • 4 queries" or null
  startedAt: string; // ISO string
  formattedDate: string; // e.g. "Sep 10, 7:43 PM"
  status: string;
}

export interface DashboardUsageStats {
  totalConvoMinutes: number;
  convoMinutesFormatted: string;
  convoFreeTierLimit: number; // 300
  convoPercentage: number;
  totalVoiceSessions: number;
  onboardingSessionsCount: number;
  buyerSessionsCount: number;
  totalRoutesElements: number;
  routesFreeTierLimit: number; // 70000
  totalGroundingQueries: number;
  groundingFreeTierLimit: number; // 5000
  estimatedSpendUsd: number;
  isFreeTierActive: boolean;
  draftsCount: number;
  publishedCount: number;
}
