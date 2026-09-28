import { createHash, randomBytes } from "node:crypto";
import { type Database, sessions, users } from "@qdot/database";
import { and, eq, gt, lt } from "drizzle-orm";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Sessions are extended when less than this much time remains (sliding expiry). */
const RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(db: Database, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function resolveSession(db: Database, token: string) {
  const id = hashToken(token);
  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;

  let expiresAt = row.expiresAt;
  if (expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
  }
  return { user: row.user, expiresAt, renewed: expiresAt !== row.expiresAt };
}

export async function deleteSession(db: Database, token: string) {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

export async function purgeExpiredSessions(db: Database) {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
