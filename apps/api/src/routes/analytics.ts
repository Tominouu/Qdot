import type { Database } from "@qdot/database";
import { AnalyticsQuerySchema } from "@qdot/types";
import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { parse } from "../lib/errors";
import { currentUser, requireUser } from "../plugins/auth";
import { workspaceAnalytics } from "../services/analytics";

export async function analyticsRoutes(app: FastifyInstance, { db }: { db: Database }) {
  /** Workspace-wide analytics across all of the user's QR codes. */
  app.get("/analytics", { preHandler: requireUser }, async (request) => {
    const user = currentUser(request);
    return workspaceAnalytics(db, user.id, parse(AnalyticsQuerySchema, request.query));
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
