ALTER TABLE "property_knowledge_bases" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD COLUMN "listing_type" text;--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD COLUMN "price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD COLUMN "kb_data" jsonb;--> statement-breakpoint
ALTER TABLE "property_knowledge_bases" ADD COLUMN "ea_script" text;