import type { Database, UserRow } from "@qdot/database";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Env } from "../env";
import { unauthenticated } from "../lib/errors";
import { resolveSession } from "../services/sessions";

export const SESSION_COOKIE = "qdot_session";

declare module "fastify" {
  interface FastifyRequest {
    user: UserRow | null;
  }
}

export function setSessionCookie(reply: FastifyReply, env: Env, token: string, expiresAt: Date) {
  reply.setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    signed: true,
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply, env: Env) {
  reply.clearCookie(SESSION_COOKIE, { path: "/", httpOnly: true, sameSite: "lax", secure: env.cookieSecure });
}

/** Raw session token from the signed cookie, or null if missing/tampered. */
export function readSessionToken(request: FastifyRequest): string | null {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) return null;
  const unsigned = request.unsignCookie(raw);
  return unsigned.valid ? unsigned.value : null;
}

/** Resolves `request.user` from the session cookie on every request. */
export function registerAuth(app: FastifyInstance, db: Database, env: Env) {
  app.decorateRequest("user", null);
  app.decorateRequest("workspace", null);
  app.addHook("onRequest", async (request, reply) => {
    // Public scan redirects and health checks never need a session lookup.
    if (request.url.startsWith("/r/") || request.url === "/health") return;
    const token = readSessionToken(request);
    if (!token) return;
    const session = await resolveSession(db, token);
    if (!session) return;
    request.user = session.user;
    if (session.renewed) setSessionCookie(reply, env, token, session.expiresAt);
  });
}

/** preHandler for routes that need a signed-in user. */
export async function requireUser(request: FastifyRequest) {
  if (!request.user) throw unauthenticated();
}

export function currentUser(request: FastifyRequest): UserRow {
  if (!request.user) throw unauthenticated();
  return request.user;
}
