import { randomBytes } from "node:crypto";
import { type Database, qrCodes, type QRCodeRow, scanEvents } from "@qdot/database";
import { normalizeDesign, type QRCode, type QRStatus } from "@qdot/types";
import { and, count, countDistinct, desc, eq, ilike, inArray, max, or, type SQL } from "drizzle-orm";
import type { Env } from "../env";
import { notFound } from "../lib/errors";
import { openContent } from "./qr-content";
import type { SecretBox } from "./secrets";

/** 31 characters, no look-alikes (0/o, 1/l/i). */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const CODE_LENGTH = 8; // ≈ 39.6 bits of entropy
export const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/** Random, unpredictable public identifier (CSPRNG, rejection sampling to avoid modulo bias). */
export function generateCode(): string {
  const limit = 256 - (256 % CODE_ALPHABET.length);
  let out = "";
  while (out.length < CODE_LENGTH) {
    for (const b of randomBytes(CODE_LENGTH * 2)) {
      if (b < limit && out.length < CODE_LENGTH) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
    }
  }
  return out;
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface QRStats {
  total: number;
  unique: number;
  lastScanAt: Date | string | null;
}

/**
 * Row → API shape. Pass `secrets` only when the owner is viewing or editing this
 * one code: without it (lists, campaigns) secrets such as Wi-Fi passwords are stripped.
 * Legacy rows (v1 style, no content) are upgraded here, never rewritten behind the owner's back.
 */
export function toQRDTO(row: QRCodeRow, stats: QRStats | null, env: Env, secrets: SecretBox | null = null): QRCode {
  const { content, redacted } = openContent(row, secrets);
  return {
    id: row.id,
    code: row.code,
    shortUrl: `${env.QR_REDIRECT_BASE_URL}/r/${row.code}`,
    name: row.name,
    type: row.contentType,
    mode: row.mode,
    category: row.category,
    content,
    contentRedacted: redacted,
    destinationUrl: row.mode === "dynamic" ? row.destinationUrl : null,
    status: row.status,
    design: normalizeDesign(row.configuration),
    campaignId: row.campaignId,
    totalScans: stats?.total ?? 0,
    uniqueScans: stats?.unique ?? 0,
    lastScanAt: stats?.lastScanAt ? new Date(stats.lastScanAt).toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface ListFilters {
  status?: QRStatus;
  search?: string;
  campaignId?: string;
  ids?: string[];
}

/** User's QR codes with aggregated scan stats, newest first. */
export async function listQRCodesWithStats(db: Database, userId: string, filters: ListFilters = {}) {
  const owned = db.select({ id: qrCodes.id }).from(qrCodes).where(eq(qrCodes.userId, userId));
  const stats = db
    .select({
      qrCodeId: scanEvents.qrCodeId,
      total: count().as("total"),
      unique: countDistinct(scanEvents.visitorHash).as("unique"),
      lastScanAt: max(scanEvents.createdAt).as("last_scan_at"),
    })
    .from(scanEvents)
    .where(inArray(scanEvents.qrCodeId, owned))
    .groupBy(scanEvents.qrCodeId)
    .as("stats");

  const conditions: SQL[] = [eq(qrCodes.userId, userId)];
  if (filters.status) conditions.push(eq(qrCodes.status, filters.status));
  if (filters.campaignId) conditions.push(eq(qrCodes.campaignId, filters.campaignId));
  if (filters.ids) conditions.push(inArray(qrCodes.id, filters.ids.length ? filters.ids : ["00000000-0000-0000-0000-000000000000"]));
  if (filters.search) {
    const term = `%${filters.search.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(or(ilike(qrCodes.name, term), ilike(qrCodes.destinationUrl, term))!);
  }

  const rows = await db
    .select({ qr: qrCodes, total: stats.total, unique: stats.unique, lastScanAt: stats.lastScanAt })
    .from(qrCodes)
    .leftJoin(stats, eq(stats.qrCodeId, qrCodes.id))
    .where(and(...conditions))
    .orderBy(desc(qrCodes.createdAt));

  return rows.map((r) => ({
    row: r.qr,
    stats: { total: Number(r.total ?? 0), unique: Number(r.unique ?? 0), lastScanAt: r.lastScanAt ?? null },
  }));
}

/** Ownership check: another user's QR code is indistinguishable from a missing one. */
export async function getOwnedQRCode(db: Database, userId: string, id: string): Promise<QRCodeRow> {
  if (!UUID_PATTERN.test(id)) throw notFound("QR_NOT_FOUND", "QR code not found.");
  const [row] = await db
    .select()
    .from(qrCodes)
    .where(and(eq(qrCodes.id, id), eq(qrCodes.userId, userId)))
    .limit(1);
  if (!row) throw notFound("QR_NOT_FOUND", "QR code not found.");
  return row;
}
