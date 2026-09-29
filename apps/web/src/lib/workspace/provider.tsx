"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { isUnauthenticated } from "@/lib/api/client";
import { createWorkspace as apiCreateWorkspace, listWorkspaces } from "@/lib/api/workspaces";
import { useI18n } from "@/lib/i18n/provider";
import { can, type CreateWorkspaceInput, type Permission, type Workspace } from "@/types";
import { getActiveWorkspaceId, setActiveWorkspaceId } from "./store";

interface WorkspaceApi {
  workspaces: Workspace[];
  current: Workspace;
  /** UI hint only: the API enforces the same matrix on every request. */
  can: (permission: Permission) => boolean;
  select: (id: string) => void;
  create: (input: CreateWorkspaceInput) => Promise<Workspace>;
  /** Refetch the list (after a rename, a role change, leaving…). */
  reload: () => Promise<Workspace[]>;
}

const WorkspaceContext = createContext<WorkspaceApi | null>(null);

/** Detail pages belong to one workspace: after switching, go back to the section's list. */
function sectionRoot(pathname: string): string | null {
  const match = /^\/(qr-codes|campaigns)\/[^/]+/.exec(pathname);
  return match ? `/${match[1]}` : null;
}

/**
 * Loads the user's workspaces and selects one (the last used, if still a member,
 * else the first, i.e. Personal). Everything below is keyed by the workspace id:
 * switching remounts the pages, so QR codes, campaigns, analytics and members
 * are refetched for the new workspace at once.
 */
export function WorkspaceProvider({
  children,
  fallback,
  empty,
}: {
  children: ReactNode;
  fallback: ReactNode;
  /** Shown when the user has no workspace left (receives the create function). */
  empty: (create: WorkspaceApi["create"]) => ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  /** Signed out (editor during onboarding): render without a workspace. */
  const [anonymous, setAnonymous] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useI18n();

  const apply = useCallback((list: Workspace[]) => {
    const stored = getActiveWorkspaceId();
    const chosen = list.find((w) => w.id === stored) ?? list[0] ?? null;
    setActiveWorkspaceId(chosen?.id ?? null);
    setWorkspaces(list);
    setCurrentId(chosen?.id ?? null);
    return list;
  }, []);

  const reload = useCallback(async () => apply(await listWorkspaces()), [apply]);

  useEffect(() => {
    listWorkspaces().then(apply, (err: unknown) => {
      if (isUnauthenticated(err)) setAnonymous(true);
      else setWorkspaces([]);
    });
  }, [apply]);

  const select = useCallback(
    (id: string) => {
      const target = workspaces?.find((w) => w.id === id);
      if (!target || id === currentId) return;
      setActiveWorkspaceId(id);
      setCurrentId(id);
      toast(t.workspace.switched(target.name), "info");
      const root = sectionRoot(pathname);
      if (root) router.push(root);
    },
    [workspaces, currentId, pathname, router, toast, t],
  );

  const create = useCallback(
    async (input: CreateWorkspaceInput) => {
      const ws = await apiCreateWorkspace(input);
      setActiveWorkspaceId(ws.id);
      setWorkspaces((list) => [...(list ?? []), ws]);
      setCurrentId(ws.id);
      const root = sectionRoot(pathname);
      if (root) router.push(root);
      return ws;
    },
    [pathname, router],
  );

  const current = workspaces?.find((w) => w.id === currentId) ?? null;
  const api = useMemo<WorkspaceApi | null>(
    () =>
      current && workspaces
        ? { workspaces, current, can: (p) => can(current.role, p), select, create, reload }
        : null,
    [current, workspaces, select, create, reload],
  );

  if (anonymous) return <>{children}</>;
  if (workspaces === null) return <>{fallback}</>;
  if (!api) return <>{empty(create)}</>;
  return (
    <WorkspaceContext.Provider value={api}>
      <WorkspaceScope key={api.current.id}>{children}</WorkspaceScope>
    </WorkspaceContext.Provider>
  );
}

/** Keyed boundary: a new workspace means fresh page state and fresh data. */
function WorkspaceScope({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return ctx;
}

/** Same as useWorkspace, but null outside a provider (shared components). */
export function useOptionalWorkspace(): WorkspaceApi | null {
  return useContext(WorkspaceContext);
}

/**
 * Whether the current role allows `permission` (UI only; the API decides).
 * Outside a workspace (signed-out onboarding editor) nothing is restricted.
 */
export function useCan(permission: Permission): boolean {
  const ctx = useContext(WorkspaceContext);
  return ctx ? ctx.can(permission) : true;
}
