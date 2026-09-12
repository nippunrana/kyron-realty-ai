ALTER TABLE "voice_sessions" ADD COLUMN "telephony_status" text DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD COLUMN "telephony_call_sid" text;--> statement-breakpoint
ALTER TABLE "voice_sessions" ADD COLUMN "manager_transcripts" jsonb DEFAULT '[]'::jsonb;