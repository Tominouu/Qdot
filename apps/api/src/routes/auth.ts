import { type Database, users, type UserRow } from "@qdot/database";
import { LoginSchema, RegisterSchema, type User } from "@qdot/types";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { Env } from "../env";
import { AppError, isUniqueViolation, parse, unauthenticated } from "../lib/errors";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "../plugins/auth";
import { createSession, deleteSession } from "../services/sessions";

/** Login/register: 10 attempts per minute per IP. */
const authRateLimit = { rateLimit: { max: 10, timeWindow: "1 minute" } };

export function toUserDTO(u: UserRow): User {
  return { id: u.id, name: u.name, email: u.email, avatarUrl: null, createdAt: u.createdAt.toISOString() };
}

function nameFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").split("+")[0]; // ignore plus-addressing tags
  const words = local.split(/[._+-]+/).filter(Boolean);
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Qdot user";
}

// Verifying against a real hash when the email is unknown keeps response times similar.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= argon2.hash("qdot-timing-equalizer"));

export async function authRoutes(app: FastifyInstance, { db, env }: { db: Database; env: Env }) {
  app.post("/auth/register", { config: authRateLimit }, async (request, reply) => {
    const input = parse(RegisterSchema, request.body);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    let user: UserRow;
    try {
      [user] = await db
        .insert(users)
        .values({ email: input.email, passwordHash, name: input.name || nameFromEmail(input.email) })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) throw new AppError(409, "EMAIL_TAKEN", "An account with this email already exists.");
      throw err;
    }
    const session = await createSession(db, user.id);
    setSessionCookie(reply, env, session.token, session.expiresAt);
    return reply.status(201).send({ user: toUserDTO(user) });
  });

  app.post("/auth/login", { config: authRateLimit }, async (request, reply) => {
    const input = parse(LoginSchema, request.body);
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    const valid = user ? await argon2.verify(user.passwordHash, input.password) : await argon2.verify(await getDummyHash(), input.password).then(() => false);
    if (!user || !valid) throw new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
    const session = await createSession(db, user.id);
    setSessionCookie(reply, env, session.token, session.expiresAt);
    return { user: toUserDTO(user) };
  });

  app.post("/auth/logout", async (request, reply) => {
    const token = readSessionToken(request);
    if (token) await deleteSession(db, token);
    clearSessionCookie(reply, env);
    return reply.status(204).send();
  });

  app.get("/auth/me", async (request) => {
    if (!request.user) throw unauthenticated();
    return { user: toUserDTO(request.user) };
  });
}
