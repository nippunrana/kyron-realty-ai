import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  numeric, 
  integer, 
  jsonb, 
  boolean, 
  primaryKey 
} from "drizzle-orm/pg-core";

// ==========================================
// 1. PROPERTIES (CORE INVENTORY)
// ==========================================
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  listingType: text("listing_type").notNull().default("rent"), // 'rent' | 'sale'
  // Vocabulary and the follow-up fact each type requires live in src/lib/property-types.ts.
  // Deliberately has no default: an unstated type must never be written as "apartment".
  propertyType: text("property_type").notNull(),
  status: text("status").notNull().default("active"), // 'draft' | 'active' | 'under_contract' | 'closed'
  
  // Pricing & Terms
  price: numeric("price", { precision: 12, scale: 2 }).notNull(), // Target Monthly Rent or Listing Sale Price
  securityDeposit: numeric("security_deposit", { precision: 12, scale: 2 }),
  minLeaseMonths: integer("min_lease_months").default(12),
  hoaFeeMonthly: numeric("hoa_fee_monthly", { precision: 10, scale: 2 }).default("0"),
  
  // Physical Specifications
  address: text("address").notNull(),
  unitNumber: text("unit_number"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("India"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"), // Carpet area on commercial listings
  floorNumber: integer("floor_number"), // 0 = ground; negative = basement
  storeys: integer("storeys"),
  rentScope: text("rent_scope"), // 'whole_property' | 'single_floor' - multi-storey rentals only
  washrooms: integer("washrooms"), // Commercial counterpart to bathrooms
  furnishingStatus: text("furnishing_status"), // 'bare_shell' | 'semi_furnished' | 'fully_furnished'
  yearBuilt: integer("year_built"),
  availableDate: timestamp("available_date"),
  
  // Marketing & Media
  coverImageUrl: text("cover_image_url"),
  images: jsonb("images").$type<string[]>().default([]),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  qrCodeSvg: text("qr_code_svg"),
  shareUrl: text("share_url"),
  uploadToken: text("upload_token"),
  
  // Automated Valuation & Ingestion Source
  aiValuationEstimate: numeric("ai_valuation_estimate", { precision: 12, scale: 2 }),
  aiGrowthScore: integer("ai_growth_score"),
  onboardingSource: text("onboarding_source").default("conversational_wizard"), // 'voice_chat' | 'manual'
  sourceUrl: text("source_url"),
  managerPhone: text("manager_phone"),

  // Consolidated AI Knowledge Base & Intelligence (RAG & Voice Brain)
  knowledgeBase: jsonb("knowledge_base").$type<PropertyKnowledgeBaseData>(),

  // Consolidated Financial & Negotiation Guardrails
  negotiationRules: jsonb("negotiation_rules").$type<PropertyNegotiationRules>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 2. PROPERTY MEDIA ASSETS
// ==========================================
export const propertyMedia = pgTable("property_media", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  mediaType: text("media_type").notNull().default("image"), // 'image' | 'floorplan' | 'virtual_tour' | 'video'
  url: text("url").notNull(),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * One measured travel distance from the property to a nearby place.
 *
 * Sourced ONLY from Google Routes API Compute Route Matrix, keyed on the Google Maps
 * placeId that Gemini's Maps grounding returned. Never populated from model estimates.
 */
export interface NearbyPlaceDistance {
  /** Google Maps placeId the distance was measured against. */
  placeId: string;
  /** Place name as shown to the owner, matching the string lists below. */
  name: string;
  category: "transit" | "school" | "hospital";
  walkMeters?: number;
  walkSeconds?: number;
  driveMeters?: number;
  driveSeconds?: number;
}

export interface HyperLocalKbData {
  /** The locality Google Maps resolved the address to, echoed back so the owner can catch a bad match. */
  resolvedLocality?: string;
  locationConfidence?: "high" | "medium" | "low";
  /** Field names the research covered least well, for targeted owner confirmation. */
  needsOwnerVerification?: string[];
  /** False when the Maps grounding tool did not fire: the content is unverified model recall. */
  grounded?: boolean;
  /** Google Maps place records backing the content above; required for Maps attribution. */
  sources?: Array<{ title: string; uri: string; placeId?: string }>;
  /**
   * Measured walk/drive distances for the places named below. Additive: the string lists
   * stay authoritative for names, this only annotates them. Absent on rows enriched
   * before distance measurement existed, and whenever `distancesMeasured` is false.
   */
  nearbyDistances?: NearbyPlaceDistance[];
  /** False when Routes API was unconfigured or unreachable, so distances are simply absent. */
  distancesMeasured?: boolean;
  transit?: {
    nearestMetro?: string;
    majorHighways?: string[];
    commuteConnectivity?: string;
  };
  neighborhood?: {
    landmarks?: string[];
    topSchools?: string[];
    topHospitals?: string[];
    vibeAndLivability?: string;
  };
  buyerObjectionsAndPlaybook?: Array<{
    topic: string;
    likelyQuestion: string;
    voiceAgentRecommendedAnswer: string;
  }>;
  searchTags?: string[];
}

export interface PropertyKnowledgeBaseData {
  rawScrapedMarkdown?: string | null;
  synthesizedSalesPitch?: string | null;
  neighborhoodSummary?: string | null;
  schoolDistrictInfo?: string | null;
  petPolicyDetail?: string | null;
  parkingDetail?: string | null;
  utilitiesDetail?: string | null;
  washroomDetail?: string | null;
  applicationProcess?: string | null;
  faqs?: Array<{ question: string; answer: string; category: string }>;
  kbData?: HyperLocalKbData | null;
  eaScript?: string | null;
  agentTone?: string | null;
  greetingMessage?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface ConcessionRule {
  condition: string;
  concession: string;
  maxConcessionValue: number;
  requiresApproval: boolean;
}

export interface PropertyNegotiationRules {
  allowNegotiation?: boolean;
  targetPrice?: number;
  minFloorPrice?: number;
  maxAllowedDiscountPct?: number;
  concessionRules?: ConcessionRule[];
  brokerEscalationThreshold?: number | null;
  notesForAgent?: string | null;
}

// ==========================================
// 5. VOICE SESSIONS (AGORA CALL RECORDS)
// ==========================================
export const voiceSessions = pgTable("voice_sessions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
  channelName: text("channel_name").notNull(),
  agoraSessionId: text("agora_session_id"),
  callerType: text("caller_type").notNull().default("buyer_inquiry"), // 'buyer_inquiry' | 'owner_onboarding'
  callerIdentifier: text("caller_identifier"),
  
  durationSeconds: integer("duration_seconds").default(0),
  turnCount: integer("turn_count").default(0),
  
  transcript: jsonb("transcript").$type<Array<{
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: number;
  }>>().default([]),
  callSummary: text("call_summary"),
  leadInterestScore: integer("lead_interest_score"),
  sentimentAnalysis: text("sentiment_analysis"),
  status: text("status").default("active"),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// ==========================================
// 6. INQUIRIES & QUALIFIED BUYER LEADS
// ==========================================
export const inquiriesAndLeads = pgTable("inquiries_and_leads", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  voiceSessionId: integer("voice_session_id").references(() => voiceSessions.id, { onDelete: "set null" }),
  
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredContactMethod: text("preferred_contact_method").default("phone"),
  
  intent: text("intent").notNull().default("rent"),
  budgetMax: numeric("budget_max", { precision: 12, scale: 2 }),
  moveInTargetDate: timestamp("move_in_target_date"),
  hasPets: boolean("has_pets"),
  occupantsCount: integer("occupants_count"),
  negotiatedPrice: numeric("negotiated_price", { precision: 12, scale: 2 }),
  agreedTerms: text("agreed_terms"),
  
  leadStatus: text("lead_status").default("new"),
  leadScore: integer("lead_score").default(50),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 7. VIEWING APPOINTMENTS
// ==========================================
export const viewingAppointments = pgTable("viewing_appointments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  leadId: integer("lead_id").notNull().references(() => inquiriesAndLeads.id, { onDelete: "cascade" }),
  voiceSessionId: integer("voice_session_id").references(() => voiceSessions.id, { onDelete: "set null" }),
  
  tourType: text("tour_type").notNull().default("in_person"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  status: text("status").notNull().default("confirmed"),
  
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email"),
  attendeePhone: text("attendee_phone"),
  specialRequests: text("special_requests"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 8. LEGACY INQUIRIES (COMPATIBILITY)
// ==========================================
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  aiSentiment: text("ai_sentiment"),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 9. MARKET INSIGHTS
// ==========================================
export const marketInsights = pgTable("market_insights", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: numeric("metric_value", { precision: 10, scale: 2 }).notNull(),
  trendDirection: text("trend_direction").notNull(),
  aiAnalysisSummary: text("ai_analysis_summary"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// ==========================================
// 10. AUTH.JS (NEXTAUTH V5) TABLES
// ==========================================
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: text("role").default("investor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    /**
     * Google calendar this app created for the owner under `calendar.app.created`.
     * Null means no calendar yet: either the account is not Google, or the owner
     * declined the calendar scopes. Callers must treat null as "no scheduling", never
     * as an error. See src/lib/google-calendar.ts.
     */
    calendarId: text("calendar_id"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);
