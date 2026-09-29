import { type Database, workspaceMembers, workspaces, type WorkspaceRow } from "@qdot/database";
import { can, WORKSPACE_HEADER, type Permission, type WorkspaceRole } from "@qdot/types";
import { and, asc, eq } from "drizzle-orm";
import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { AppError, notFound } from "../lib/errors";
import { UUID_PATTERN } from "../services/qr-codes";
import { currentUser } from "./auth";

/**
 * Tenant resolution and authorization, in one place.
 *
 * The client says which workspace it is working in (X-Qdot-Workspace header),
 * but that value is only a request: the membership row behind it is loaded from
 * the database on every call, and its role is what gets checked. A workspace
 * the user doesn't belong to is indistinguishable from one that doesn't exist.
 * Every resource query is then scoped to `request.workspace.id` (never to an id
 * taken from the body or the URL).
 */

export interface WorkspaceContext {
  id: string;
  role: WorkspaceRole;
  row: WorkspaceRow;
}

declare module "fastify" {
  interface FastifyRequest {
    workspace: WorkspaceContext | null;
  }
}

const workspaceNotFound = () => notFound("WORKSPACE_NOT_FOUND", "Workspace not found.");

export async function loadMembership(db: Database, userId: string, workspaceId: string): Promise<WorkspaceContext | null> {
  if (!UUID_PATTERN.test(workspaceId)) return null;
  const [m] = await db
    .select({ role: workspaceMembers.role, row: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1);
  return m ? { id: m.row.id, role: m.role, row: m.row } : null;
}

/** Without a header (older clients), the user's first workspace, i.e. their Personal one. */
async function defaultMembership(db: Database, userId: string): Promise<WorkspaceContext | null> {
  const [m] = await db
    .select({ role: workspaceMembers.role, row: workspaces })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(asc(workspaceMembers.createdAt))
    .limit(1);
  return m ? { id: m.row.id, role: m.role, row: m.row } : null;
}

export async function resolveWorkspace(db: Database, request: FastifyRequest): Promise<WorkspaceContext> {
  if (request.workspace) return request.workspace;
  const user = currentUser(request);
  const header = request.headers[WORKSPACE_HEADER];
  const requested = Array.isArray(header) ? header[0] : header;
  const ctx = requested ? await loadMembership(db, user.id, requested.trim()) : await defaultMembership(db, user.id);
  if (!ctx) throw workspaceNotFound();
  request.workspace = ctx;
  return ctx;
}

/** preHandler: signed in, member of the selected workspace, and allowed to `permission`. */
export function requirePermission(db: Database, permission: Permission): preHandlerAsyncHookHandler {
  return async (request) => {
    const ctx = await resolveWorkspace(db, request);
    if (!can(ctx.role, permission)) throw new AppError(403, "FORBIDDEN", "Your role in this workspace doesn't allow this action.");
  };
}

/** The resolved workspace inside a handler protected by `requirePermission`. */
export function currentWorkspace(request: FastifyRequest): WorkspaceContext {
  if (!request.workspace) throw workspaceNotFound();
  return request.workspace;
}
