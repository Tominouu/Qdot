ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_destination_check";--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "destination_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "mode" text DEFAULT 'dynamic' NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "content_type" text DEFAULT 'url' NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "content" jsonb;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_mode_check" CHECK ("qr_codes"."mode" in ('dynamic', 'static'));--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_destination_check" CHECK ("qr_codes"."mode" = 'static' or ("qr_codes"."destination_url" is not null and "qr_codes"."destination_url" ~* '^https?://'));