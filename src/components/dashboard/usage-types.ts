export interface SessionCostBreakdown {
  voiceCostUsd: number;
  routesCostUsd: number;
  mapsCostUsd: number;
  aiCostUsd: number;
  totalCostUsd: number;
  voiceCostInr: number;
  routesCostInr: number;
  mapsCostInr: number;
  aiCostInr: number;
  totalCostInr: number;
}

export interface SessionHistoryItem {
  id: number;
  propertyId: number | null;
  propertyTitle: string;
  propertySlug?: string | null;
  isDraft: boolean;
  isUnsavedIntake?: boolean;
  callerType: "owner_onboarding" | "buyer_inquiry" | string;
  durationSeconds: number;
  durationFormatted: string;
  durationMinutes: string;
  mapsUsageSummary: string | null; // e.g. "12 elem • 4 queries" or null
  startedAt: string; // ISO string
  formattedDate: string; // e.g. "Sep 10, 7:43 PM"
  status: string;
  isAgoraVerified?: boolean;
  costBreakdown?: SessionCostBreakdown;
  routesElements?: number;
  groundingQueries?: number;
}

export interface DashboardUsageStats {
  totalConvoMinutes: number;
  convoMinutesFormatted: string;
  convoFreeTierLimit: number; // 300
  convoMinutesRemaining: number; // e.g. 280
  convoOverageMinutes: number; // e.g. 0
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
  // Commercial spend metrics (raw, zero-free-tier)
  totalCommercialSpendUsd: number;
  totalCommercialSpendInr: number;
  voiceSpendUsd: number;
  routesSpendUsd: number;
  mapsSpendUsd: number;
  aiSpendUsd: number;
}
