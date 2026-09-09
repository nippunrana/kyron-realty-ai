TRUNCATE TABLE "property_media", "properties" CASCADE;--> statement-breakpoint
DROP TABLE "negotiation_matrices" CASCADE;--> statement-breakpoint
DROP TABLE "property_knowledge_bases" CASCADE;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "knowledge_base" jsonb;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "negotiation_rules" jsonb;