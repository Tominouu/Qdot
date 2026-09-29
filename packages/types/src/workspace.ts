import { z } from "zod";

/**
 * Workspaces (multi-tenancy). Every QR code, campaign and analytics query
 * belongs to exactly one workspace; users reach them through a membership role.
 *
 * The permission matrix lives here, shared by the API (which enforces it) and
 * the web app (which only uses it to hide actions a role can't perform).
 */

export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];
/** Roles an invitation or a role change can grant: ownership only moves through a transfer. */
export const ASSIGNABLE_ROLES = ["admin", "editor", "viewer"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const PERMISSIONS = {
  "qr:read": ["owner", "admin", "editor", "viewer"],
  "qr:write": ["owner", "admin", "editor"],
  "campaign:read": ["owner", "admin", "editor", "viewer"],
  "campaign:write": ["owner", "admin", "editor"],
  "analytics:read": ["owner", "admin", "editor", "viewer"],
  "members:read": ["owner", "admin", "editor", "viewer"],
  "members:manage": ["owner", "admin"],
  "workspace:update": ["owner"],
  "workspace:delete": ["owner"],
  "workspace:transfer": ["owner"],
} as const satisfies Record<string, readonly WorkspaceRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: WorkspaceRole | null | undefined, permission: Permission): boolean {
  return role != null && (PERMISSIONS[permission] as readonly WorkspaceRole[]).includes(role);
}

/** Rank for "may this actor act on that member" checks: nobody manages someone above them. */
export const ROLE_RANK: Record<WorkspaceRole, number> = { owner: 3, admin: 2, editor: 1, viewer: 0 };

/** Header carrying the selected workspace. The API always verifies the membership behind it. */
export const WORKSPACE_HEADER = "x-qdot-workspace";

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

const workspaceName = z.string().trim().min(1, "Name is required").max(60, "Name must be 60 characters or fewer");
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(48, "Slug must be 48 characters or fewer")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens");

export const CreateWorkspaceSchema = z.object({ name: workspaceName, slug: slug.optional() });
export type CreateWorkspaceInput = z.input<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z
  .object({ name: workspaceName, slug })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateWorkspaceInput = z.input<typeof UpdateWorkspaceSchema>;

/** Deleting requires typing the workspace slug, checked server-side. */
export const DeleteWorkspaceSchema = z.object({ confirm: z.string() });

export const InviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  role: z.enum(ASSIGNABLE_ROLES),
});
export type InviteMemberInput = z.input<typeof InviteMemberSchema>;

export const UpdateMemberSchema = z.object({ role: z.enum(ASSIGNABLE_ROLES) });
export const TransferOwnershipSchema = z.object({ userId: z.string().uuid() });

export const INVITATION_TTL_DAYS = 7;
export const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  /** The current user's role in it. */
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: AssignableRole;
  status: InvitationStatus;
  invitedBy: string | null;
  expiresAt: string;
  createdAt: string;
}

/** Returned once, at creation: the token is never stored in clear nor shown again. */
export interface CreatedInvitation {
  invitation: Invitation;
  token: string;
}

/** What an invitee sees on /invite/:token, before signing in. */
export interface InvitationPreview {
  workspaceName: string;
  email: string;
  role: AssignableRole;
  invitedBy: string | null;
  status: InvitationStatus;
  expiresAt: string;
  /** Whether an account already exists for the invited email (sign in vs. sign up). */
  accountExists: boolean;
}
