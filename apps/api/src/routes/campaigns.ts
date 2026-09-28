import { campaigns, type CampaignRow, type Database, qrCodes } from "@qdot/database";
import { AnalyticsQuerySchema, type Campaign, CreateCampaignSchema, UpdateCampaignSchema } from "@qdot/types";
import { and, count, desc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Env } from "../env";
import { notFound, parse } from "../lib/errors";
import { currentUser, requireUser } from "../plugins/auth";
import { campaignAnalytics } from "../services/analytics";
import { listQRCodesWithStats, toQRDTO, UUID_PATTERN } from "../services/qr-codes";

function toCampaignDTO(row: CampaignRow, qrCodeCount: number): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    qrCodeCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOwnedCampaign(db: Database, userId: string, id: string): Promise<CampaignRow> {
  if (!UUID_PATTERN.test(id)) throw notFound("CAMPAIGN_NOT_FOUND", "Campaign not found.");
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
    .limit(1);
  if (!row) throw notFound("CAMPAIGN_NOT_FOUND", "Campaign not found.");
  return row;
}

async function qrCount(db: Database, campaignId: string) {
  const [r] = await db.select({ n: count() }).from(qrCodes).where(eq(qrCodes.campaignId, campaignId));
  return Number(r?.n ?? 0);
}

export async function campaignRoutes(app: FastifyInstance, { db, env }: { db: Database; env: Env }) {
  app.addHook("preHandler", requireUser);

  app.post("/campaigns", async (request, reply) => {
    const user = currentUser(request);
    const input = parse(CreateCampaignSchema, request.body);
    const [row] = await db.insert(campaigns).values({ userId: user.id, name: input.name, description: input.description }).returning();
    return reply.status(201).send(toCampaignDTO(row, 0));
  });

  app.get("/campaigns", async (request) => {
    const user = currentUser(request);
    const rows = await db
      .select({ campaign: campaigns, qrCodeCount: count(qrCodes.id) })
      .from(campaigns)
      .leftJoin(qrCodes, eq(qrCodes.campaignId, campaigns.id))
      .where(eq(campaigns.userId, user.id))
      .groupBy(campaigns.id)
      .orderBy(desc(campaigns.createdAt));
    return rows.map((r) => toCampaignDTO(r.campaign, Number(r.qrCodeCount)));
  });

  app.get<{ Params: { id: string } }>("/campaigns/:id", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedCampaign(db, user.id, request.params.id);
    const codes = await listQRCodesWithStats(db, user.id, { campaignId: row.id });
    return { campaign: toCampaignDTO(row, codes.length), qrCodes: codes.map((c) => toQRDTO(c.row, c.stats, env)) };
  });

  app.patch<{ Params: { id: string } }>("/campaigns/:id", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedCampaign(db, user.id, request.params.id);
    const input = parse(UpdateCampaignSchema, request.body);
    const [updated] = await db
      .update(campaigns)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(campaigns.id, row.id))
      .returning();
    return toCampaignDTO(updated, await qrCount(db, row.id));
  });

  /** Deleting a campaign keeps its QR codes (they become unassigned). */
  app.delete<{ Params: { id: string } }>("/campaigns/:id", async (request, reply) => {
    const user = currentUser(request);
    const row = await getOwnedCampaign(db, user.id, request.params.id);
    await db.delete(campaigns).where(eq(campaigns.id, row.id));
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/campaigns/:id/analytics", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedCampaign(db, user.id, request.params.id);
    const { tz } = parse(AnalyticsQuerySchema, request.query);
    const codes = await db
      .select({ id: qrCodes.id, name: qrCodes.name, status: qrCodes.status })
      .from(qrCodes)
      .where(and(eq(qrCodes.campaignId, row.id), eq(qrCodes.userId, user.id)));
    return campaignAnalytics(db, row.id, codes, tz);
  });
}
