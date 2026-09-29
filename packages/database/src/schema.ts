import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { QRCategory, QRContentType, QRDesign, QRMode, QRStatus, QRStyle } from "@qdot/types";

/** `QRContent` as persisted: secrets (Wi-Fi password) are replaced by an encrypted `passwordEnc`. */
export type StoredQRContent = { type: QRContentType } & Record<string, unknown>;

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Stored lowercased; uniqueness is case-insensitive by construction. */
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the session token; the raw token only ever lives in the cookie. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    ...timestamps,
  },
  (t) => [index("campaigns_user_id_idx").on(t.userId)],
);

export const qrCodes = pgTable(
  "qr_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    /** Public random identifier used in /r/:code. */
    code: text("code").notNull().unique(),
    name: text("name").notNull().default(""),
    category: text("category").$type<QRCategory>().notNull().default("website"),
    /** Redirect target of dynamic codes; null for static codes (their content is in the image). */
    destinationUrl: text("destination_url"),
    status: text("status").$type<QRStatus>().notNull().default("active"),
    /** Derived from status so the redirect gate can't drift out of sync. */
    isActive: boolean("is_active").generatedAlwaysAs(sql`status = 'active'`),
    /** "dynamic": the image encodes /r/:code (redirect + analytics). "static": content encoded directly. Fixed at creation. */
    mode: text("mode").$type<QRMode>().notNull().default("dynamic"),
    contentType: text("content_type").$type<QRContentType>().notNull().default("url"),
    /** Type-specific content (secrets encrypted by the API). Null for codes created before content types. */
    content: jsonb("content").$type<StoredQRContent>(),
    /** Visual design: v2 `QRDesign`, or the legacy v1 `QRStyle` for older codes (upgraded on read). */
    configuration: jsonb("configuration").$type<QRDesign | QRStyle>().notNull(),
    ...timestamps,
  },
  (t) => [
    index("qr_codes_user_id_idx").on(t.userId),
    index("qr_codes_campaign_id_idx").on(t.campaignId),
    check("qr_codes_status_check", sql`${t.status} in ('active', 'paused', 'archived', 'draft')`),
    check("qr_codes_mode_check", sql`${t.mode} in ('dynamic', 'static')`),
    check(
      "qr_codes_destination_check",
      sql`${t.mode} = 'static' or (${t.destinationUrl} is not null and ${t.destinationUrl} ~* '^https?://')`,
    ),
  ],
);

export const scanEvents = pgTable(
  "scan_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    qrCodeId: uuid("qr_code_id")
      .notNull()
      .references(() => qrCodes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    country: text("country"),
    countryCode: text("country_code"),
    region: text("region"),
    city: text("city"),
    deviceType: text("device_type").$type<"mobile" | "desktop" | "tablet">().notNull(),
    os: text("os"),
    browser: text("browser"),
    /** Referrer hostname only. */
    referrer: text("referrer"),
    /**
     * Keyed hash of (daily salt, IP, user agent). The salt is random, held in
     * memory and rotated daily, so this cannot be linked back to an IP or
     * across days. Used only to approximate unique daily visitors.
     */
    visitorHash: text("visitor_hash"),
  },
  (t) => [index("scan_events_qr_code_created_idx").on(t.qrCodeId, t.createdAt)],
);

export type UserRow = typeof users.$inferSelect;
export type QRCodeRow = typeof qrCodes.$inferSelect;
export type CampaignRow = typeof campaigns.$inferSelect;
export type ScanEventRow = typeof scanEvents.$inferSelect;
