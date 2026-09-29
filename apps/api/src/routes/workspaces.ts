import { type Database, invitations, users, workspaceMembers, workspaces } from "@qdot/database";
import {
  can,
  CreateWorkspaceSchema,
  DeleteWorkspaceSchema,
  InviteMemberSchema,
  ROLE_RANK,
  TransferOwnershipSchema,
  UpdateMemberSchema,
  UpdateWorkspaceSchema,
  type InvitationPreview,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@qdot/types";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { AppError, isUniqueViolation, notFound, parse } from "../lib/errors";
import { currentUser, requireUser } from "../plugins/auth";
import { currentWorkspace, requirePermission } from "../plugins/workspace";
import { UUID_PATTERN } from "../services/qr-codes";
import {
  createWorkspace,
  expireInvitations,
  findUserByEmail,
  hashToken,
  invitationExpiry,
  listUserWorkspaces,
  newInvitationToken,
  toInvitationDTO,
  toWorkspaceDTO,
} from "../services/workspaces";
import { acceptInvitation, findInvitation } from "../services/invitations";

const forbidden = (message: string) => new AppError(403, "FORBIDDEN", message);
const memberNotFound = () => notFound("MEMBER_NOT_FOUND", "Member not found.");

/** An actor manages only members strictly below them; the owner manages everyone else. */
function assertCanManage(actor: WorkspaceRole, target: WorkspaceRole) {
  if (target === "owner") throw forbidden("The owner can't be changed or removed. Transfer ownership first.");
  if (actor !== "owner" && ROLE_RANK[target] >= ROLE_RANK[actor]) throw forbidden("You can only manage members with a lower role than yours.");
}

/** Nobody hands out a role above their own. */
function assertCanGrant(actor: WorkspaceRole, role: WorkspaceRole) {
  if (ROLE_RANK[role] > ROLE_RANK[actor]) throw forbidden("You can't grant a role above your own.");
}

/** Public invitation lookups: tokens are 256-bit, but keep guessing pointless anyway. */
const invitationRateLimit = { rateLimit: { max: 30, timeWindow: "1 minute" } };

export async function workspaceRoutes(app: FastifyInstance, { db }: { db: Database }) {
  const allow = (p: Parameters<typeof requirePermission>[1]) => ({ preHandler: [requireUser, requirePermission(db, p)] });

  async function memberCount(workspaceId: string) {
    const [r] = await db.select({ n: count() }).from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
    return Number(r?.n ?? 0);
  }

  async function getMember(workspaceId: string, userId: string) {
    if (!UUID_PATTERN.test(userId)) throw memberNotFound();
    const [m] = await db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
      .limit(1);
    if (!m) throw memberNotFound();
    return m;
  }

  /* ---------------- The user's workspaces ---------------- */

  app.get("/workspaces", { preHandler: requireUser }, async (request) => listUserWorkspaces(db, currentUser(request).id));

  app.post("/workspaces", { preHandler: requireUser }, async (request, reply) => {
    const user = currentUser(request);
    const input = parse(CreateWorkspaceSchema, request.body);
    const row = await db.transaction((tx) => createWorkspace(tx, user.id, input.name, input.slug));
    return reply.status(201).send(toWorkspaceDTO(row, "owner", 1));
  });

  /* ---------------- The selected workspace ---------------- */

  app.get("/workspace", allow("members:read"), async (request) => {
    const ws = currentWorkspace(request);
    return toWorkspaceDTO(ws.row, ws.role, await memberCount(ws.id));
  });

  app.patch("/workspace", allow("workspace:update"), async (request) => {
    const ws = currentWorkspace(request);
    const input = parse(UpdateWorkspaceSchema, request.body);
    try {
      const [row] = await db
        .update(workspaces)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(workspaces.id, ws.id))
        .returning();
      return toWorkspaceDTO(row, ws.role, await memberCount(ws.id));
    } catch (err) {
      if (isUniqueViolation(err)) throw new AppError(409, "SLUG_TAKEN", "This slug is already used by another workspace.", { slug: "This slug is already used." });
      throw err;
    }
  });

  /** Deletes the workspace with everything in it (QR codes, their scans, campaigns, invitations). */
  app.delete("/workspace", allow("workspace:delete"), async (request, reply) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const { confirm } = parse(DeleteWorkspaceSchema, request.body ?? {});
    if (confirm.trim() !== ws.row.slug) throw new AppError(400, "VALIDATION_ERROR", "Type the workspace slug to confirm.", { confirm: "Type the workspace slug to confirm." });
    const [others] = await db
      .select({ n: count() })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.userId, user.id), ne(workspaceMembers.workspaceId, ws.id)));
    if (Number(others?.n ?? 0) === 0) throw new AppError(409, "LAST_WORKSPACE", "You can't delete your only workspace.");
    await db.delete(workspaces).where(eq(workspaces.id, ws.id));
    return reply.status(204).send();
  });

  /** Makes another member the owner; the current owner becomes an admin. */
  app.post("/workspace/transfer", allow("workspace:transfer"), async (request) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const { userId } = parse(TransferOwnershipSchema, request.body);
    if (userId === user.id) throw new AppError(400, "VALIDATION_ERROR", "You already own this workspace.");
    await getMember(ws.id, userId);
    await db.transaction(async (tx) => {
      // Demote first: the database allows a single owner per workspace.
      await tx.update(workspaceMembers).set({ role: "admin" }).where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, user.id)));
      await tx.update(workspaceMembers).set({ role: "owner" }).where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, userId)));
    });
    return toWorkspaceDTO(ws.row, "admin", await memberCount(ws.id));
  });

  /* ---------------- Members ---------------- */

  app.get("/workspace/members", allow("members:read"), async (request): Promise<WorkspaceMember[]> => {
    const ws = currentWorkspace(request);
    const rows = await db
      .select({ userId: users.id, name: users.name, email: users.email, role: workspaceMembers.role, joinedAt: workspaceMembers.createdAt })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, ws.id))
      .orderBy(asc(workspaceMembers.createdAt));
    const order = (r: WorkspaceRole) => -ROLE_RANK[r];
    return rows
      .map((r) => ({ ...r, joinedAt: r.joinedAt.toISOString() }))
      .sort((a, b) => order(a.role) - order(b.role));
  });

  app.patch<{ Params: { userId: string } }>("/workspace/members/:userId", allow("members:manage"), async (request) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const { role } = parse(UpdateMemberSchema, request.body);
    if (request.params.userId === user.id) throw forbidden("You can't change your own role.");
    const target = await getMember(ws.id, request.params.userId);
    assertCanManage(ws.role, target.role);
    assertCanGrant(ws.role, role);
    await db
      .update(workspaceMembers)
      .set({ role })
      .where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, target.userId)));
    return { userId: target.userId, role };
  });

  /** Removes a member, or lets a member leave (`userId` = themselves). The owner can't leave. */
  app.delete<{ Params: { userId: string } }>("/workspace/members/:userId", allow("members:read"), async (request, reply) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const target = await getMember(ws.id, request.params.userId);
    if (target.userId === user.id) {
      if (target.role === "owner") throw forbidden("Transfer ownership before leaving this workspace.");
    } else {
      if (!can(ws.role, "members:manage")) throw forbidden("Your role in this workspace doesn't allow this action.");
      assertCanManage(ws.role, target.role);
    }
    await db.delete(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, target.userId)));
    return reply.status(204).send();
  });

  /* ---------------- Invitations (managed from the workspace) ---------------- */

  app.get("/workspace/invitations", allow("members:manage"), async (request) => {
    const ws = currentWorkspace(request);
    await expireInvitations(db, ws.id);
    const rows = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.workspaceId, ws.id), inArray(invitations.status, ["pending", "expired"])))
      .orderBy(desc(invitations.createdAt))
      .limit(100);
    return rows.map((r) => toInvitationDTO(r));
  });

  /** No email service yet: the response carries the link token, to be copied and sent by the inviter. */
  app.post("/workspace/invitations", allow("members:manage"), async (request, reply) => {
    const user = currentUser(request);
    const ws = currentWorkspace(request);
    const input = parse(InviteMemberSchema, request.body);
    assertCanGrant(ws.role, input.role);

    const existing = await findUserByEmail(db, input.email);
    if (existing) {
      const [member] = await db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, ws.id), eq(workspaceMembers.userId, existing.id)))
        .limit(1);
      if (member) throw new AppError(409, "ALREADY_MEMBER", "This person is already a member of the workspace.", { email: "Already a member." });
    }

    const token = newInvitationToken();
    const row = await db.transaction(async (tx) => {
      // Re-inviting replaces the previous live link.
      await tx
        .update(invitations)
        .set({ status: "revoked" })
        .where(and(eq(invitations.workspaceId, ws.id), eq(invitations.email, input.email), eq(invitations.status, "pending")));
      const [created] = await tx
        .insert(invitations)
        .values({ workspaceId: ws.id, email: input.email, role: input.role, tokenHash: hashToken(token), invitedBy: user.id, expiresAt: invitationExpiry() })
        .returning();
      return created;
    });
    return reply.status(201).send({ invitation: toInvitationDTO(row), token });
  });

  app.delete<{ Params: { id: string } }>("/workspace/invitations/:id", allow("members:manage"), async (request, reply) => {
    const ws = currentWorkspace(request);
    if (!UUID_PATTERN.test(request.params.id)) throw notFound("INVITATION_NOT_FOUND", "Invitation not found.");
    const [row] = await db
      .update(invitations)
      .set({ status: "revoked" })
      .where(and(eq(invitations.id, request.params.id), eq(invitations.workspaceId, ws.id), eq(invitations.status, "pending")))
      .returning({ id: invitations.id });
    if (!row) throw notFound("INVITATION_NOT_FOUND", "Invitation not found.");
    return reply.status(204).send();
  });

  /* ---------------- Invitations (invitee side) ---------------- */

  /** What the invitation link shows before signing in. Unknown, revoked and malformed tokens all look the same. */
  app.get<{ Params: { token: string } }>("/invitations/:token", { config: invitationRateLimit }, async (request): Promise<InvitationPreview> => {
    const found = await findInvitation(db, request.params.token);
    const [inviter] = found.invitation.invitedBy
      ? await db.select({ name: users.name }).from(users).where(eq(users.id, found.invitation.invitedBy)).limit(1)
      : [];
    const status = toInvitationDTO(found.invitation).status;
    return {
      workspaceName: found.workspace.name,
      email: found.invitation.email,
      role: found.invitation.role,
      invitedBy: inviter?.name ?? null,
      status,
      expiresAt: found.invitation.expiresAt.toISOString(),
      accountExists: Boolean(await findUserByEmail(db, found.invitation.email)),
    };
  });

  app.post<{ Params: { token: string } }>(
    "/invitations/:token/accept",
    { preHandler: requireUser, config: invitationRateLimit },
    async (request) => {
      const user = currentUser(request);
      const ws = await db.transaction((tx) => acceptInvitation(tx, request.params.token, user));
      return toWorkspaceDTO(ws.row, ws.role, await memberCount(ws.row.id));
    },
  );
}
