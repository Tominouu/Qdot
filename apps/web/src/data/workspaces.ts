import type { Invitation, WorkspaceMember, WorkspaceRole } from "@/types";
import { CURRENT_USER } from "./user";

/** Mock-only workspace record (the API returns the caller's role with each workspace). */
export interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  createdAt: string;
}

export const PERSONAL_WORKSPACE_ID = "ws_personal";

export const WORKSPACES: MockWorkspace[] = [
  { id: PERSONAL_WORKSPACE_ID, name: "Personal", slug: "personal-alex", role: "owner", createdAt: "2026-01-10T09:00:00.000Z" },
  { id: "ws_acme", name: "ACME", slug: "acme", role: "admin", createdAt: "2026-03-02T09:00:00.000Z" },
];

const me = (role: WorkspaceRole, joinedAt: string): WorkspaceMember => ({ userId: CURRENT_USER.id, name: CURRENT_USER.name, email: CURRENT_USER.email, role, joinedAt });

export const MEMBERS: Record<string, WorkspaceMember[]> = {
  [PERSONAL_WORKSPACE_ID]: [me("owner", "2026-01-10T09:00:00.000Z")],
  ws_acme: [
    { userId: "usr_camille", name: "Camille Durand", email: "camille@acme.test", role: "owner", joinedAt: "2026-03-02T09:00:00.000Z" },
    me("admin", "2026-03-04T10:00:00.000Z"),
    { userId: "usr_hugo", name: "Hugo Martin", email: "hugo@acme.test", role: "editor", joinedAt: "2026-04-11T08:30:00.000Z" },
    { userId: "usr_lea", name: "Léa Petit", email: "lea@acme.test", role: "viewer", joinedAt: "2026-06-20T14:00:00.000Z" },
  ],
};

export const INVITATIONS: Record<string, Invitation[]> = { [PERSONAL_WORKSPACE_ID]: [], ws_acme: [] };
