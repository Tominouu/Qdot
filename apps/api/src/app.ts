import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Database } from "@qdot/database";
import Fastify, { type FastifyServerOptions } from "fastify";
import type { Env } from "./env";
import { AppError, registerErrorHandling } from "./lib/errors";
import { registerAuth } from "./plugins/auth";
import { analyticsRoutes, healthRoutes } from "./routes/analytics";
import { authRoutes } from "./routes/auth";
import { campaignRoutes } from "./routes/campaigns";
import { qrRoutes } from "./routes/qr-codes";
import { redirectRoutes } from "./routes/redirect";
import type { GeoResolver } from "./services/geoip";
import { createSecretBox } from "./services/secrets";

export interface AppDeps {
  env: Env;
  db: Database;
  geo: GeoResolver;
  logger?: FastifyServerOptions["logger"];
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function buildApp({ env, db, geo, logger = true }: AppDeps) {
  const app = Fastify({
    logger,
    trustProxy: env.TRUST_PROXY,
    // Logo and background images are stored as data URLs inside the design (≤ 1 MB each).
    bodyLimit: 4 * 1024 * 1024,
  });

  registerErrorHandling(app);

  await app.register(cookie, { secret: env.SESSION_SECRET });
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });
  await app.register(rateLimit, { global: false });

  // CSRF defense in depth (on top of SameSite=Lax cookies): browsers always send
  // Origin on cross-site state-changing requests; reject unknown ones.
  app.addHook("onRequest", async (request) => {
    if (!MUTATING.has(request.method)) return;
    const origin = request.headers.origin;
    if (origin && !env.CORS_ORIGIN.includes(origin)) throw new AppError(403, "FORBIDDEN", "Origin not allowed.");
  });

  app.addHook("onSend", async (_request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
  });

  registerAuth(app, db, env);

  await app.register(healthRoutes, { db });
  await app.register(redirectRoutes, { db, env, geo });
  await app.register(authRoutes, { db, env });
  await app.register(qrRoutes, { db, env, secrets: createSecretBox(env.DATA_ENCRYPTION_KEY ?? env.SESSION_SECRET) });
  await app.register(campaignRoutes, { db, env });
  await app.register(analyticsRoutes, { db });

  return app;
}
