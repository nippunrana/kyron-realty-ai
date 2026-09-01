CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"ai_sentiment" text,
	"is_processed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries_and_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"voice_session_id" integer,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"preferred_contact_method" text DEFAULT 'phone',
	"intent" text DEFAULT 'rent' NOT NULL,
	"budget_max" numeric(12, 2),
	"move_in_target_date" timestamp,
	"has_pets" boolean,
	"occupants_count" integer,
	"negotiated_price" numeric(12, 2),
	"agreed_terms" text,
	"lead_status" text DEFAULT 'new',
	"lead_score" integer DEFAULT 50,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" numeric(10, 2) NOT NULL,
	"trend_direction" text NOT NULL,
	"ai_analysis_summary" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiation_matrices" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"allow_negotiation" boolean DEFAULT true,
	"target_price" numeric(12, 2) NOT NULL,
	"min_floor_price" numeric(12, 2) NOT NULL,
	"max_allowed_discount_pct" numeric(4, 2) DEFAULT '5.00',
	"concession_rules" jsonb DEFAULT '[]'::jsonb,
	"broker_escalation_threshold" numeric(12, 2),
	"notes_for_agent" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "negotiation_matrices_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"listing_type" text DEFAULT 'rent' NOT NULL,
	"property_type" text DEFAULT 'apartment' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"security_deposit" numeric(12, 2),
	"min_lease_months" integer DEFAULT 12,
	"hoa_fee_monthly" numeric(10, 2) DEFAULT '0',
	"address" text NOT NULL,
	"unit_number" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"country" text DEFAULT 'USA',
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"sqft" integer,
	"year_built" integer,
	"available_date" timestamp,
	"cover_image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"features" jsonb DEFAULT '[]'::jsonb,
	"qr_code_svg" text,
	"share_url" text,
	"ai_valuation_estimate" numeric(12, 2),
	"ai_growth_score" integer,
	"onboarding_source" text DEFAULT 'conversational_wizard',
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "property_knowledge_bases" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"raw_scraped_markdown" text,
	"synthesized_sales_pitch" text,
	"neighborhood_summary" text,
	"school_district_info" text,
	"pet_policy_detail" text,
	"parking_detail" text,
	"utilities_detail" text,
	"application_process" text,
	"faqs" jsonb DEFAULT '[]'::jsonb,
	"agent_tone" text DEFAULT 'warm_professional',
	"greeting_message" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_knowledge_bases_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
CREATE TABLE "property_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	"role" text DEFAULT 'investor',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "viewing_appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"lead_id" integer NOT NULL,
	"voice_session_id" integer,
	"tour_type" text DEFAULT 'in_person' NOT NULL,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"attendee_name" text NOT NULL,
	"attendee_email" text,
	"attendee_phone" text,
	"special_requests" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"channel_name" text NOT NULL,
	"agora_session_id" text,
	"caller_type" text DEFAULT 'buyer_inquiry' NOT NULL,
	"caller_identifier" text,
	"duration_seconds" integer DEFAULT 0,
	"turn_count" integer DEFAULT 0,
	"transcript" jsonb DEFAULT '[]'::jsonb,
	"call_summary" text,
	"lead_interest_score" integer,
	"sentiment_analysis" text,
	"status" text DEFAULT 'active',
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries_and_leads" ADD CONSTRAINT "inquiries_and_leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries_and_leads" ADD CONSTRAINT "inquiries_and_leads_voice_session_id_voice_sessions_id_fk" FOREIGN KEY ("voice_session_id") REFERENCES "public"."voice_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_matrices" ADD CONSTRAINT "negotiation_matrices_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD CONSTRAINT "property_knowledge_bases_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_lead_id_inquiries_and_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."inquiries_and_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewing_appointments" ADD CONSTRAINT "viewing_appointments_voice_session_id_voice_sessions_id_fk" FOREIGN KEY ("voice_session_id") REFERENCES "public"."voice_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD CONSTRAINT "voice_sessions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;