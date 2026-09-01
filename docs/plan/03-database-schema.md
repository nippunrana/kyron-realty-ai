# 03. Database Architecture & Schema Specification

## 1. Entity Relationship Overview

```
 ┌──────────────────────┐        1:N        ┌──────────────────────┐
 │        users         ├──────────────────►│      properties      │
 │  (Owners / Brokers)  │                   │  (Rentals & Sales)   │
 └──────────────────────┘                   └──────────┬───────────┘
                                                       │
         ┌────────────────────────┬────────────────────┼────────────────────────┬────────────────────────┐
         │ 1:N                    │ 1:1                │ 1:1                    │ 1:N                    │ 1:N
         ▼                        ▼                    ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐ ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  property_media  │    │property_knowledge│ │negotiation_matrix│    │  voice_sessions  │    │inquiries_and_lead│
│ (Photos, Tours)  │    │  _bases (RAG)    │ │ (Guardrails)     │    │ (Agora Calls)    │    │ (Buyer Leads)    │
└──────────────────┘    └──────────────────┘ └──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                                                              │ 1:1                   │ 1:N
                                                                              ▼                       ▼
                                                                     ┌──────────────────────────────────────────┐
                                                                     │          viewing_appointments            │
                                                                     │     (Calendar Tour Walkthroughs)         │
                                                                     └──────────────────────────────────────────┘
```

---

## 2. Complete Drizzle ORM Schema (`src/db/schema.ts`)

```typescript
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  numeric, 
  integer, 
  jsonb, 
  boolean, 
  primaryKey, 
  uuid 
} from "drizzle-orm/pg-core";

// ==========================================
// 1. PROPERTIES (CORE INVENTORY)
// ==========================================
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(), // e.g. "luxury-2bhk-marina-loft-san-francisco"
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
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default("USA"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  availableDate: timestamp("available_date"),
  
  // Marketing & AI Flags
  coverImageUrl: text("cover_image_url"),
  images: jsonb("images").$type<string[]>().default([]),
  amenities: jsonb("amenities").$type<string[]>().default([]), // ["In-unit Washer/Dryer", "EV Charger", "Rooftop Pool"]
  qrCodeSvg: text("qr_code_svg"),
  shareUrl: text("share_url"),
  
  // Automated Valuation & Analytics
  aiValuationEstimate: numeric("ai_valuation_estimate", { precision: 12, scale: 2 }),
  aiGrowthScore: integer("ai_growth_score"),
  onboardingSource: text("onboarding_source").default("conversational_wizard"), // 'apify_url' | 'voice_chat' | 'manual'
  sourceUrl: text("source_url"), // Original URL if scraped
  
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
  synthesizedSalesPitch: text("synthesized_sales_pitch"), // High-converting summary tailored for speech
  neighborhoodSummary: text("neighborhood_summary"), // WalkScore, transit, restaurants, safety
  schoolDistrictInfo: text("school_district_info"),
  petPolicyDetail: text("pet_policy_detail"), // Allowed breeds, weight limits, pet deposit/rent
  parkingDetail: text("parking_detail"), // Assigned stall, EV charging, guest parking rules
  utilitiesDetail: text("utilities_detail"), // Water/Trash included, electricity tenant paid
  applicationProcess: text("application_process"), // Credit score requirements, background checks, screening fee
  
  // Structured FAQ Array for Real-Time LLM Context
  faqs: jsonb("faqs").$type<Array<{ question: string; answer: string; category: string }>>().default([]),
  
  // Agent Persona Settings
  agentTone: text("agent_tone").default("warm_professional"), // 'warm_professional' | 'luxury_concierge' | 'energetic_sales'
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
  minFloorPrice: numeric("min_floor_price", { precision: 12, scale: 2 }).notNull(), // Absolute hard bottom
  maxAllowedDiscountPct: numeric("max_allowed_discount_pct", { precision: 4, scale: 2 }).default("5.00"),
  
  // Exchange-of-Value Concession Rules (Array of conditional triggers)
  concessionRules: jsonb("concession_rules").$type<Array<{
    condition: string; // e.g. "18_month_lease" | "move_in_within_7_days" | "cash_buyer" | "waived_contingencies"
    concession: string; // e.g. "5% discount on monthly rent" | "Waived first month parking fee ($200 value)"
    maxConcessionValue: number;
    requiresApproval: boolean;
  }>>().default([]),
  
  brokerEscalationThreshold: numeric("broker_escalation_threshold", { precision: 12, scale: 2 }), // Inquiries above this value trigger human escalation
  notesForAgent: text("notes_for_agent"), // Internal broker instructions
  
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
  callerIdentifier: text("caller_identifier"), // IP hash or client session ID
  
  durationSeconds: integer("duration_seconds").default(0),
  turnCount: integer("turn_count").default(0),
  
  // Full Transcript & Intelligence Extraction
  transcript: jsonb("transcript").$type<Array<{
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    timestamp: number;
  }>>().default([]),
  callSummary: text("call_summary"),
  leadInterestScore: integer("lead_interest_score"), // 1 - 100
  sentimentAnalysis: text("sentiment_analysis"), // 'highly_positive' | 'interested' | 'neutral' | 'skeptical'
  status: text("status").default("active"), // 'active' | 'completed' | 'dropped'
  
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
  
  // Buyer Details
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredContactMethod: text("preferred_contact_method").default("phone"), // 'phone' | 'email' | 'whatsapp'
  
  // Qualification Details
  intent: text("intent").notNull().default("rent"), // 'rent' | 'buy'
  budgetMax: numeric("budget_max", { precision: 12, scale: 2 }),
  moveInTargetDate: timestamp("move_in_target_date"),
  hasPets: boolean("has_pets"),
  occupantsCount: integer("occupants_count"),
  negotiatedPrice: numeric("negotiated_price", { precision: 12, scale: 2 }),
  agreedTerms: text("agreed_terms"),
  
  leadStatus: text("lead_status").default("new"), // 'new' | 'contacted' | 'viewing_scheduled' | 'application_submitted' | 'closed'
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
  
  tourType: text("tour_type").notNull().default("in_person"), // 'in_person' | 'virtual_video'
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'completed' | 'rescheduled' | 'cancelled'
  
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email"),
  attendeePhone: text("attendee_phone"),
  specialRequests: text("special_requests"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 3. Database Indexes & Performance Strategy
- **Unique Slugs**: `properties(slug)` indexed for $O(1)$ fast public listing lookup.
- **Foreign Key Cascade Deletes**: Property deletion cleans up media, knowledge bases, and negotiation matrices automatically.
- **JSONB Querying**: Fast lookup on `amenities` and `faqs` using PostgreSQL GIN indexing.
- **Migration Path**: Managed via `npx drizzle-kit generate` and `npx drizzle-kit push`.
