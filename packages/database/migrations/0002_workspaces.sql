CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invitations_role_check" CHECK ("invitations"."role" in ('admin', 'editor', 'viewer')),
	CONSTRAINT "invitations_status_check" CHECK ("invitations"."status" in ('pending', 'accepted', 'revoked', 'expired'))
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id"),
	CONSTRAINT "workspace_members_role_check" CHECK ("workspace_members"."role" in ('owner', 'admin', 'editor', 'viewer'))
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "qr_codes" DROP CONSTRAINT "qr_codes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
-- Data migration (hand-written): every existing user gets a "Personal" workspace
-- they own, holding all of their QR codes and campaigns. QR codes keep their id
-- and public code, so printed codes, redirects and analytics are untouched.
CREATE TEMPORARY TABLE "_workspace_backfill" AS
  SELECT "id" AS "user_id", gen_random_uuid() AS "workspace_id", "created_at" FROM "users";--> statement-breakpoint
INSERT INTO "workspaces" ("id", "name", "slug", "created_at", "updated_at")
  SELECT "workspace_id", 'Personal', 'personal-' || replace("user_id"::text, '-', ''), "created_at", now() FROM "_workspace_backfill";--> statement-breakpoint
INSERT INTO "workspace_members" ("workspace_id", "user_id", "role", "created_at")
  SELECT "workspace_id", "user_id", 'owner', "created_at" FROM "_workspace_backfill";--> statement-breakpoint
UPDATE "qr_codes" SET "workspace_id" = b."workspace_id" FROM "_workspace_backfill" b WHERE "qr_codes"."user_id" = b."user_id";--> statement-breakpoint
UPDATE "campaigns" SET "workspace_id" = b."workspace_id" FROM "_workspace_backfill" b WHERE "campaigns"."user_id" = b."user_id";--> statement-breakpoint
DROP TABLE "_workspace_backfill";--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_codes" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_workspace_id_idx" ON "invitations" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_one_pending_idx" ON "invitations" USING btree ("workspace_id","email") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_one_owner_idx" ON "workspace_members" USING btree ("workspace_id") WHERE role = 'owner';--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_workspace_id_idx" ON "campaigns" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "qr_codes_workspace_id_idx" ON "qr_codes" USING btree ("workspace_id");