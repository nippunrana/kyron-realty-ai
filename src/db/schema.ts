import { pgTable, serial, text, timestamp, numeric, integer, jsonb, boolean } from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }),
  sqft: integer("sqft"),
  propertyType: text("property_type").notNull().default("single_family"),
  status: text("status").notNull().default("active"),
  images: jsonb("images").$type<string[]>().default([]),
  features: jsonb("features").$type<string[]>().default([]),
  aiValuationEstimate: numeric("ai_valuation_estimate", { precision: 12, scale: 2 }),
  aiGrowthScore: integer("ai_growth_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const marketInsights = pgTable("market_insights", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: numeric("metric_value", { precision: 10, scale: 2 }).notNull(),
  trendDirection: text("trend_direction").notNull(),
  aiAnalysisSummary: text("ai_analysis_summary"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});
