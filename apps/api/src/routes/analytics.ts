import type { Database } from "@qdot/database";
import { AnalyticsQuerySchema } from "@qdot/types";
import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { parse } from "../lib/errors";
import { requireUser } from "../plugins/auth";
import { currentWorkspace, requirePermission } from "../plugins/workspace";
import { workspaceAnalytics } from "../services/analytics";

export async function analyticsRoutes(app: FastifyInstance, { db }: { db: Database }) {
  /** Analytics across all QR codes of the selected workspace. */
  app.get("/analytics", { preHandler: [requireUser, requirePermission(db, "analytics:read")] }, async (request) => {
    return workspaceAnalytics(db, currentWorkspace(request).id, parse(AnalyticsQuerySchema, request.query));
  });
}

export async function healthRoutes(app: FastifyInstance, { db }: { db: Database }) {
  app.get("/health", async (request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: "ok" };
    } catch (err) {
      request.log.error({ err }, "Health check: database unreachable");
      return reply.status(503).send({ status: "error" });
    }
  });
}
