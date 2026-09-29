import { type Database, type InvitationRow, invitations, workspaceMembers, workspaces, type WorkspaceRow } from "@qdot/database";
import type { WorkspaceRole } from "@qdot/types";
import { and, eq } from "drizzle-orm";
import { AppError, notFound } from "../lib/errors";
import { hashToken } from "./workspaces";

type Executor = Pick<Database, "select" | "insert" | "update" | "delete" | "execute">;

const invitationNotFound = () => notFound("INVITATION_NOT_FOUND", "This invitation link is invalid.");

/** Looks an invitation up by its raw token. Revoked links are reported as not found. */
export async function findInvitation(db: Executor, token: string): Promise<{ invitation: InvitationRow; workspace: WorkspaceRow }> {
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(token)) throw invitationNotFound();
  const [found] = await db
    .select({ invitation: invitations, workspace: workspaces })
    .from(invitations)
    .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
    .where(eq(invitations.tokenHash, hashToken(token)))
    .limit(1);
  if (!found || found.invitation.status === "revoked") throw invitationNotFound();
  return found;
}

/**
 * Checks everything that must hold before an invitation can be used: still
 * pending, not expired, and addressed to `email` (a forwarded link doesn't let
 * someone else in).
 */
export function assertUsable(invitation: InvitationRow, email: string, now = new Date()) {
  if (invitation.status === "accepted") throw new AppError(409, "INVITATION_USED", "This invitation has already been used.");
  if (invitation.status === "expired" || invitation.expiresAt <= now) throw new AppError(410, "INVITATION_EXPIRED", "This invitation has expired. Ask for a new one.");
  if (invitation.email !== email.toLowerCase())
    throw new AppError(403, "INVITATION_EMAIL_MISMATCH", `This invitation was sent to ${invitation.email}. Sign in with that address to accept it.`);
}

/**
 * Joins the invitation's workspace as `user`. Must run in a transaction: the
 * invitation is claimed with a conditional update, so a link can't be used twice
 * even by concurrent requests.
 */
export async function acceptInvitation(
  tx: Executor,
  token: string,
  user: { id: string; email: string },
): Promise<{ row: WorkspaceRow; role: WorkspaceRole }> {
  const { invitation, workspace } = await findInvitation(tx, token);
  assertUsable(invitation, user.email);

  const [claimed] = await tx
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date(), acceptedBy: user.id })
    .where(and(eq(invitations.id, invitation.id), eq(invitations.status, "pending")))
    .returning({ id: invitations.id });
  if (!claimed) throw new AppError(409, "INVITATION_USED", "This invitation has already been used.");

  const [existing] = await tx
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspace.id), eq(workspaceMembers.userId, user.id)))
    .limit(1);
  // Already a member (e.g. invited twice): keep the current role, never downgrade an owner.
  if (existing) return { row: workspace, role: existing.role };

  await tx.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, role: invitation.role });
  return { row: workspace, role: invitation.role };
}
