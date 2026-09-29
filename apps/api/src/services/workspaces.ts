import { createHash, randomBytes } from "node:crypto";
import { type Database, type InvitationRow, invitations, users, workspaceMembers, workspaces, type WorkspaceRow } from "@qdot/database";
import { INVITATION_TTL_DAYS, type Invitation, type Workspace, type WorkspaceRole } from "@qdot/types";
import { and, asc, count, eq, lt, sql } from "drizzle-orm";
import { AppError, isUniqueViolation } from "../lib/errors";

/** Anything drizzle can run queries on: the pool or a transaction. */
type Executor = Pick<Database, "select" | "insert" | "update" | "delete" | "execute">;

export function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "workspace"
  );
}

const suffix = () => randomBytes(3).toString("hex");

/** First free slug derived from `base` (random suffix on collision). */
async function availableSlug(db: Executor, base: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${suffix()}`;
    const [taken] = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, candidate)).limit(1);
    if (!taken) return candidate;
  }
  throw new AppError(500, "INTERNAL_ERROR", "Could not allocate a workspace slug. Please retry.");
}

/**
 * Creates a workspace with `ownerId` as its OWNER. Call inside a transaction so
 * the workspace never exists without its owner. An explicit slug that is taken
 * fails with SLUG_TAKEN; a derived one gets a random suffix.
 */
export async function createWorkspace(db: Executor, ownerId: string, name: string, explicitSlug?: string): Promise<WorkspaceRow> {
  const slug = explicitSlug ?? (await availableSlug(db, slugify(name)));
  try {
    const [row] = await db.insert(workspaces).values({ name, slug }).returning();
    await db.insert(workspaceMembers).values({ workspaceId: row.id, userId: ownerId, role: "owner" });
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "SLUG_TAKEN", "This slug is already used by another workspace.", { slug: "This slug is already used." });
    throw err;
  }
}

/** A new account's own space. Same shape as the ones the 0002 migration created. */
export function createPersonalWorkspace(db: Executor, userId: string) {
  return createWorkspace(db, userId, "Personal", `personal-${userId.replace(/-/g, "")}`);
}

export async function listUserWorkspaces(db: Database, userId: string): Promise<Workspace[]> {
  const memberCounts = db
    .select({ workspaceId: workspaceMembers.workspaceId, n: count().as("n") })
    .from(workspaceMembers)
    .groupBy(workspaceMembers.workspaceId)
    .as("member_counts");
  const rows = await db
    .select({ w: workspaces, role: workspaceMembers.role, joinedAt: workspaceMembers.createdAt, n: memberCounts.n })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .leftJoin(memberCounts, eq(memberCounts.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt));
  return rows.map((r) => toWorkspaceDTO(r.w, r.role, Number(r.n ?? 1)));
}

export function toWorkspaceDTO(w: WorkspaceRow, role: WorkspaceRole, memberCount: number): Workspace {
  return { id: w.id, name: w.name, slug: w.slug, role, memberCount, createdAt: w.createdAt.toISOString() };
}

/* ------------------------------------------------------------------ */
/* Invitations                                                         */
/* ------------------------------------------------------------------ */

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** 256-bit random token; only its hash is stored. */
export const newInvitationToken = () => randomBytes(32).toString("base64url");

export const invitationExpiry = (from = new Date()) => new Date(from.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

export function toInvitationDTO(row: InvitationRow, now = new Date()): Invitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status === "pending" && row.expiresAt <= now ? "expired" : row.status,
    invitedBy: row.invitedBy,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** Marks overdue invitations as expired (lazily, whenever invitations are read). */
export async function expireInvitations(db: Executor, workspaceId?: string) {
  const overdue = and(eq(invitations.status, "pending"), lt(invitations.expiresAt, sql`now()`));
  await db
    .update(invitations)
    .set({ status: "expired" })
    .where(workspaceId ? and(overdue, eq(invitations.workspaceId, workspaceId)) : overdue);
}

export async function findUserByEmail(db: Executor, email: string) {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return u ?? null;
}
