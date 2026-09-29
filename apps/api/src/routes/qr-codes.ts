import { campaigns, type Database, qrCodes, type QRCodeRow } from "@qdot/database";
import { AnalyticsQuerySchema, CreateQRCodeSchema, QR_STATUSES, UpdateQRCodeSchema } from "@qdot/types";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Env } from "../env";
import { AppError, isUniqueViolation, notFound, parse } from "../lib/errors";
import { currentUser, requireUser } from "../plugins/auth";
import { currentWorkspace, requirePermission } from "../plugins/workspace";
import { qrCodeAnalytics } from "../services/analytics";
import { generateCode, getWorkspaceQRCode, listQRCodesWithStats, toQRDTO } from "../services/qr-codes";
import { sealContent } from "../services/qr-content";
import type { SecretBox } from "../services/secrets";

const ListQuerySchema = z.object({
  status: z.enum(QR_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
});

/** A QR code can only join a campaign of its own workspace. */
async function assertCampaignInWorkspace(db: Database, workspaceId: string, campaignId: string | null | undefined) {
  if (!campaignId) return;
  const [c] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);
  if (!c) throw notFound("CAMPAIGN_NOT_FOUND", "Campaign not found.");
}

export async function qrRoutes(app: FastifyInstance, { db, env, secrets }: { db: Database; env: Env; secrets: SecretBox }) {
  app.addHook("preHandler", requireUser);
  const read = { preHandler: requirePermission(db, "qr:read") };
  const write = { preHandler: requirePermission(db, "qr:write") };

  app.post("/qr", write, async (request, reply) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const input = parse(CreateQRCodeSchema, request.body);
    await assertCampaignInWorkspace(db, ws.id, input.campaignId);

    // Retry on the (astronomically unlikely) code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const [row] = await db
          .insert(qrCodes)
          .values({
            workspaceId: ws.id,
            createdBy: user.id,
            campaignId: input.campaignId ?? null,
            code: generateCode(),
            name: input.name || "Untitled QR code",
            category: input.category,
            mode: input.mode,
            contentType: input.content.type,
            content: sealContent(input.content, secrets),
            destinationUrl: input.mode === "dynamic" && input.content.type === "url" ? input.content.url : null,
            status: input.status,
            configuration: input.design,
          })
          .returning();
        return reply.status(201).send(toQRDTO(row, null, env, secrets));
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }
    throw new AppError(500, "INTERNAL_ERROR", "Could not allocate a QR code. Please retry.");
  });

  app.get("/qr", read, async (request) => {
    const ws = currentWorkspace(request);
    const query = parse(ListQuerySchema, request.query);
    const items = await listQRCodesWithStats(db, ws.id, query);
    return items.map((i) => toQRDTO(i.row, i.stats, env));
  });

  app.get<{ Params: { id: string } }>("/qr/:id", read, async (request) => {
    const ws = currentWorkspace(request);
    const row = await getWorkspaceQRCode(db, ws.id, request.params.id);
    const [item] = await listQRCodesWithStats(db, ws.id, { ids: [row.id] });
    return toQRDTO(item.row, item.stats, env, secrets);
  });

  app.patch<{ Params: { id: string } }>("/qr/:id", write, async (request) => {
    const ws = currentWorkspace(request);
    const row = await getWorkspaceQRCode(db, ws.id, request.params.id);
    const input = parse(UpdateQRCodeSchema, request.body);
    await assertCampaignInWorkspace(db, ws.id, input.campaignId);

    const patch: Partial<QRCodeRow> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name || "Untitled QR code";
    if (input.category !== undefined) patch.category = input.category;
    if (input.content !== undefined) {
      // A dynamic code's printed image points at /r/:code, which only knows how to redirect to a URL.
      if (row.mode === "dynamic" && input.content.type !== "url")
        throw new AppError(400, "VALIDATION_ERROR", "Dynamic QR codes can only point to a URL.", { content: "Dynamic QR codes can only point to a URL." });
      patch.contentType = input.content.type;
      patch.content = sealContent(input.content, secrets);
      if (row.mode === "dynamic" && input.content.type === "url") patch.destinationUrl = input.content.url;
    }
    if (input.design !== undefined) patch.configuration = input.design;
    if (input.campaignId !== undefined) patch.campaignId = input.campaignId;
    if (input.status !== undefined) patch.status = input.status;

    await db.update(qrCodes).set(patch).where(and(eq(qrCodes.id, row.id), eq(qrCodes.workspaceId, ws.id)));
    const [item] = await listQRCodesWithStats(db, ws.id, { ids: [row.id] });
    return toQRDTO(item.row, item.stats, env, secrets);
  });

  app.delete<{ Params: { id: string } }>("/qr/:id", write, async (request, reply) => {
    const ws = currentWorkspace(request);
    const row = await getWorkspaceQRCode(db, ws.id, request.params.id);
    await db.delete(qrCodes).where(and(eq(qrCodes.id, row.id), eq(qrCodes.workspaceId, ws.id)));
    return reply.status(204).send();
  });

  app.get<{ Params: { id: string } }>("/qr/:id/analytics", { preHandler: requirePermission(db, "analytics:read") }, async (request) => {
    const ws = currentWorkspace(request);
    const row = await getWorkspaceQRCode(db, ws.id, request.params.id);
    const query = parse(AnalyticsQuerySchema, request.query);
    return qrCodeAnalytics(db, row, query);
  });
}
