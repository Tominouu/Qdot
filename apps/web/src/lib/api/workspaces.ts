import { CURRENT_USER } from "@/data/user";
import { PERSONAL_WORKSPACE_ID, type MockWorkspace } from "@/data/workspaces";
import { USE_MOCK_API } from "@/lib/config";
import {
  CreateWorkspaceSchema,
  INVITATION_TTL_DAYS,
  InviteMemberSchema,
  UpdateWorkspaceSchema,
  type AssignableRole,
  type CreatedInvitation,
  type CreateWorkspaceInput,
  type Invitation,
  type InvitationPreview,
  type InviteMemberInput,
  type UpdateWorkspaceInput,
  type Workspace,
  type WorkspaceMember,
} from "@/types";
import { ApiError, apiRequest } from "./client";
import { delay, mockWorkspaceId, readStore, writeStore } from "./mock-store";

/**
 * Workspaces, members and invitations. Workspace-scoped calls act on the
 * selected workspace (X-Qdot-Workspace header, added by apiRequest).
 * Demo mode keeps everything in the browser; invitation links can't be
 * accepted there (there is no second user).
 */

const toWorkspace = (w: MockWorkspace): Workspace => ({
  id: w.id,
  name: w.name,
  slug: w.slug,
  role: w.role,
  memberCount: readStore().members[w.id]?.length ?? 1,
  createdAt: w.createdAt,
});

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";

function current(): MockWorkspace {
  const ws = readStore().workspaces.find((w) => w.id === mockWorkspaceId());
  if (!ws) throw new ApiError("Workspace not found.", 404, "WORKSPACE_NOT_FOUND");
  return ws;
}

function validate<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string; path: PropertyKey[] }[] } } }, value: unknown): T {
  const r = schema.safeParse(value);
  if (r.success) return r.data;
  const first = r.error.issues[0];
  throw new ApiError(first?.message ?? "Invalid request.", 400, "VALIDATION_ERROR", first ? { [String(first.path[0] ?? "_")]: first.message } : undefined);
}

export async function listWorkspaces(): Promise<Workspace[]> {
  if (!USE_MOCK_API) return apiRequest<Workspace[]>("/workspaces");
  return delay(readStore().workspaces.map(toWorkspace));
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  if (!USE_MOCK_API) return apiRequest<Workspace>("/workspaces", { method: "POST", body: JSON.stringify(input) });
  const data = validate(CreateWorkspaceSchema, input);
  const base = data.slug ?? slugify(data.name);
  const taken = (slug: string) => readStore().workspaces.some((w) => w.slug === slug);
  if (data.slug && taken(base)) throw new ApiError("This slug is already used by another workspace.", 409, "SLUG_TAKEN", { slug: "This slug is already used." });
  let slug = base;
  while (taken(slug)) slug = `${base}-${Math.random().toString(16).slice(2, 8)}`;
  const ws: MockWorkspace = { id: `ws_${crypto.randomUUID().slice(0, 8)}`, name: data.name, slug, role: "owner", createdAt: new Date().toISOString() };
  writeStore((s) => {
    s.workspaces.push(ws);
    s.members[ws.id] = [{ userId: CURRENT_USER.id, name: CURRENT_USER.name, email: CURRENT_USER.email, role: "owner", joinedAt: ws.createdAt }];
    s.invitations[ws.id] = [];
  });
  return delay(toWorkspace(ws));
}

export async function updateWorkspace(input: UpdateWorkspaceInput): Promise<Workspace> {
  if (!USE_MOCK_API) return apiRequest<Workspace>("/workspace", { method: "PATCH", body: JSON.stringify(input) });
  const data = validate(UpdateWorkspaceSchema, input);
  const ws = current();
  if (data.slug && readStore().workspaces.some((w) => w.slug === data.slug && w.id !== ws.id))
    throw new ApiError("This slug is already used by another workspace.", 409, "SLUG_TAKEN", { slug: "This slug is already used." });
  writeStore((s) => Object.assign(s.workspaces.find((w) => w.id === ws.id)!, data));
  return delay(toWorkspace({ ...ws, ...data }));
}

export async function deleteWorkspace(confirm: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>("/workspace", { method: "DELETE", body: JSON.stringify({ confirm }) });
  const ws = current();
  if (confirm.trim() !== ws.slug) throw new ApiError("Type the workspace slug to confirm.", 400, "VALIDATION_ERROR", { confirm: "Type the workspace slug to confirm." });
  if (readStore().workspaces.length <= 1) throw new ApiError("You can't delete your only workspace.", 409, "LAST_WORKSPACE");
  writeStore((s) => {
    s.workspaces = s.workspaces.filter((w) => w.id !== ws.id);
    s.qrCodes = s.qrCodes.filter((q) => q.workspaceId !== ws.id);
    s.campaigns = s.campaigns.filter((c) => c.workspaceId !== ws.id);
    delete s.members[ws.id];
    delete s.invitations[ws.id];
  });
  return delay(undefined);
}

export async function transferOwnership(userId: string): Promise<Workspace> {
  if (!USE_MOCK_API) return apiRequest<Workspace>("/workspace/transfer", { method: "POST", body: JSON.stringify({ userId }) });
  const ws = current();
  writeStore((s) => {
    for (const m of s.members[ws.id] ?? []) {
      if (m.userId === CURRENT_USER.id) m.role = "admin";
      else if (m.userId === userId) m.role = "owner";
    }
    s.workspaces.find((w) => w.id === ws.id)!.role = "admin";
  });
  return delay(toWorkspace({ ...ws, role: "admin" }));
}

export async function listMembers(): Promise<WorkspaceMember[]> {
  if (!USE_MOCK_API) return apiRequest<WorkspaceMember[]>("/workspace/members");
  return delay(readStore().members[current().id] ?? []);
}

export async function updateMemberRole(userId: string, role: AssignableRole): Promise<void> {
  if (!USE_MOCK_API) {
    await apiRequest(`/workspace/members/${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ role }) });
    return;
  }
  const ws = current();
  writeStore((s) => {
    const m = s.members[ws.id]?.find((x) => x.userId === userId);
    if (m) m.role = role;
  });
  return delay(undefined);
}

/** Removes a member, or leaves the workspace when `userId` is the current user. */
export async function removeMember(userId: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>(`/workspace/members/${encodeURIComponent(userId)}`, { method: "DELETE" });
  const ws = current();
  writeStore((s) => {
    s.members[ws.id] = (s.members[ws.id] ?? []).filter((m) => m.userId !== userId);
    if (userId === CURRENT_USER.id) s.workspaces = s.workspaces.filter((w) => w.id !== ws.id);
  });
  return delay(undefined);
}

export async function listInvitations(): Promise<Invitation[]> {
  if (!USE_MOCK_API) return apiRequest<Invitation[]>("/workspace/invitations");
  return delay((readStore().invitations[current().id] ?? []).filter((i) => i.status === "pending"));
}

export async function createInvitation(input: InviteMemberInput): Promise<CreatedInvitation> {
  if (!USE_MOCK_API) return apiRequest<CreatedInvitation>("/workspace/invitations", { method: "POST", body: JSON.stringify(input) });
  const data = validate(InviteMemberSchema, input);
  const ws = current();
  if ((readStore().members[ws.id] ?? []).some((m) => m.email === data.email))
    throw new ApiError("This person is already a member of the workspace.", 409, "ALREADY_MEMBER", { email: "Already a member." });
  const now = new Date();
  const invitation: Invitation = {
    id: `inv_${crypto.randomUUID().slice(0, 8)}`,
    email: data.email,
    role: data.role,
    status: "pending",
    invitedBy: CURRENT_USER.id,
    expiresAt: new Date(now.getTime() + INVITATION_TTL_DAYS * 86_400_000).toISOString(),
    createdAt: now.toISOString(),
  };
  writeStore((s) => {
    const list = (s.invitations[ws.id] ?? []).map((i) => (i.email === data.email && i.status === "pending" ? { ...i, status: "revoked" as const } : i));
    s.invitations[ws.id] = [invitation, ...list];
  });
  return delay({ invitation, token: `demo-${crypto.randomUUID().replace(/-/g, "")}` });
}

export async function revokeInvitation(id: string): Promise<void> {
  if (!USE_MOCK_API) return apiRequest<void>(`/workspace/invitations/${encodeURIComponent(id)}`, { method: "DELETE" });
  const ws = current();
  writeStore((s) => {
    s.invitations[ws.id] = (s.invitations[ws.id] ?? []).map((i) => (i.id === id ? { ...i, status: "revoked" as const } : i));
  });
  return delay(undefined);
}

const demoOnly = () => new ApiError("Invitation links work with the Qdot API (demo mode has a single user).", 501, "NOT_IMPLEMENTED");

export async function getInvitation(token: string): Promise<InvitationPreview> {
  if (!USE_MOCK_API) return apiRequest<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`);
  throw demoOnly();
}

export async function acceptInvitation(token: string): Promise<Workspace> {
  if (!USE_MOCK_API) return apiRequest<Workspace>(`/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
  throw demoOnly();
}

export { PERSONAL_WORKSPACE_ID };
