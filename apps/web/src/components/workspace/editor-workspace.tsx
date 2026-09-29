"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceProvider } from "@/lib/workspace/provider";
import { WorkspaceEmptyState } from "./workspace-empty-state";

export function EditorWorkspace({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider
      fallback={
        <div className="flex min-h-dvh items-center justify-center" aria-busy>
          <Skeleton className="size-[384px] rounded-3xl" />
        </div>
      }
      empty={(create) => <WorkspaceEmptyState create={create} />}
    >
      {children}
    </WorkspaceProvider>
  );
}
