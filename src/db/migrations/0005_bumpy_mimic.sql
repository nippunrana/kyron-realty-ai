ALTER TABLE "properties" ALTER COLUMN "property_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "floor_number" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "storeys" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "rent_scope" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "washrooms" integer;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "furnishing_status" text;