import { campaigns, type Database, qrCodes, type QRCodeRow } from "@qdot/database";
import { AnalyticsQuerySchema, CreateQRCodeSchema, QR_STATUSES, UpdateQRCodeSchema } from "@qdot/types";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Env } from "../env";
import { AppError, isUniqueViolation, notFound, parse } from "../lib/errors";
import { currentUser, requireUser } from "../plugins/auth";
import { qrCodeAnalytics } from "../services/analytics";
import { generateCode, getOwnedQRCode, listQRCodesWithStats, toQRDTO } from "../services/qr-codes";

const ListQuerySchema = z.object({
  status: z.enum(QR_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
});

async function assertCampaignOwned(db: Database, userId: string, campaignId: string | null | undefined) {
  if (!campaignId) return;
  const [c] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);
  if (!c) throw notFound("CAMPAIGN_NOT_FOUND", "Campaign not found.");
}

export async function qrRoutes(app: FastifyInstance, { db, env }: { db: Database; env: Env }) {
  app.addHook("preHandler", requireUser);

  app.post("/qr", async (request, reply) => {
    const user = currentUser(request);
    const input = parse(CreateQRCodeSchema, request.body);
    await assertCampaignOwned(db, user.id, input.campaignId);

    // Retry on the (astronomically unlikely) code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [row] = await db
          .insert(qrCodes)
          .values({
            userId: user.id,
            campaignId: input.campaignId ?? null,
            code: generateCode(),
            name: input.name || "Untitled QR code",
            category: input.category,
            destinationUrl: input.destinationUrl,
            status: input.status,
            configuration: input.style,
          })
          .returning();
        return reply.status(201).send(toQRDTO(row, null, env));
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }
    throw new AppError(500, "INTERNAL_ERROR", "Could not allocate a QR code. Please retry.");
  });

  app.get("/qr", async (request) => {
    const user = currentUser(request);
    const query = parse(ListQuerySchema, request.query);
    const items = await listQRCodesWithStats(db, user.id, query);
    return items.map((i) => toQRDTO(i.row, i.stats, env));
  });

  app.get<{ Params: { id: string } }>("/qr/:id", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedQRCode(db, user.id, request.params.id);
    const [item] = await listQRCodesWithStats(db, user.id, { ids: [row.id] });
    return toQRDTO(item.row, item.stats, env);
  });

  app.patch<{ Params: { id: string } }>("/qr/:id", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedQRCode(db, user.id, request.params.id);
    const input = parse(UpdateQRCodeSchema, request.body);
    await assertCampaignOwned(db, user.id, input.campaignId);

    const patch: Partial<QRCodeRow> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name || "Untitled QR code";
    if (input.category !== undefined) patch.category = input.category;
    if (input.destinationUrl !== undefined) patch.destinationUrl = input.destinationUrl;
    if (input.style !== undefined) patch.configuration = input.style;
    if (input.campaignId !== undefined) patch.campaignId = input.campaignId;
    if (input.status !== undefined) patch.status = input.status;

    await db.update(qrCodes).set(patch).where(eq(qrCodes.id, row.id));
    const [item] = await listQRCodesWithStats(db, user.id, { ids: [row.id] });
    return toQRDTO(item.row, item.stats, env);
  });

  app.delete<{ Params: { id: string } }>("/qr/:id", async (request, reply) => {
    const user = currentUser(request);
    const row = await getOwnedQRCode(db, user.id, request.params.id);
    await db.delete(qrCodes).where(eq(qrCodes.id, row.id));
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/qr/:id/analytics", async (request) => {
    const user = currentUser(request);
    const row = await getOwnedQRCode(db, user.id, request.params.id);
    const query = parse(AnalyticsQuerySchema, request.query);
    return qrCodeAnalytics(db, row, query);
  });
}
