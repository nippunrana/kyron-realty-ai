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
  propertyType: text("property_type").notNull().default("apartment"), // 'apartment' | 'single_family' | 'condo' | 'townhouse' | 'commercial'
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
  country: text("country").default("USA"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  availableDate: timestamp("available_date"),
  
  // Marketing & Media
  coverImageUrl: text("cover_image_url"),
  images: jsonb("images").$type<string[]>().default([]),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  qrCodeSvg: text("qr_code_svg"),
  shareUrl: text("share_url"),
  
  // Automated Valuation & Ingestion Source
  aiValuationEstimate: numeric("ai_valuation_estimate", { precision: 12, scale: 2 }),
  aiGrowthScore: integer("ai_growth_score"),
  onboardingSource: text("onboarding_source").default("conversational_wizard"), // 'apify_url' | 'voice_chat' | 'manual'
  sourceUrl: text("source_url"),
  
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

// ==========================================
// 3. PROPERTY KNOWLEDGE BASES (RAG & VOICE AGENT BRAIN)
// ==========================================
export const propertyKnowledgeBases = pgTable("property_knowledge_bases", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().unique().references(() => properties.id, { onDelete: "cascade" }),
  
  // Raw and Synthesized Content
  rawScrapedMarkdown: text("raw_scraped_markdown"),
  synthesizedSalesPitch: text("synthesized_sales_pitch"),
  neighborhoodSummary: text("neighborhood_summary"),
  schoolDistrictInfo: text("school_district_info"),
  petPolicyDetail: text("pet_policy_detail"),
  parkingDetail: text("parking_detail"),
  utilitiesDetail: text("utilities_detail"),
  applicationProcess: text("application_process"),
  
  // Structured FAQ Array for Real-Time LLM Context
  faqs: jsonb("faqs").$type<Array<{ question: string; answer: string; category: string }>>().default([]),
  
  // Agent Persona Settings
  agentTone: text("agent_tone").default("warm_professional"),
  greetingMessage: text("greeting_message"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 4. NEGOTIATION MATRICES & CONCESSION GUARDRAILS
// ==========================================
export const negotiationMatrices = pgTable("negotiation_matrices", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().unique().references(() => properties.id, { onDelete: "cascade" }),
  
  allowNegotiation: boolean("allow_negotiation").default(true),
  targetPrice: numeric("target_price", { precision: 12, scale: 2 }).notNull(),
  minFloorPrice: numeric("min_floor_price", { precision: 12, scale: 2 }).notNull(),
  maxAllowedDiscountPct: numeric("max_allowed_discount_pct", { precision: 4, scale: 2 }).default("5.00"),
  
  concessionRules: jsonb("concession_rules").$type<Array<{
    condition: string;
    concession: string;
    maxConcessionValue: number;
    requiresApproval: boolean;
  }>>().default([]),
  
  brokerEscalationThreshold: numeric("broker_escalation_threshold", { precision: 12, scale: 2 }),
  notesForAgent: text("notes_for_agent"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
