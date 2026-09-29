"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/provider";
import type { CreateWorkspaceInput, Workspace } from "@/types";
import { CreateWorkspaceModal } from "./create-workspace-modal";

/** The user left or lost every workspace: offer to create one. */
export function WorkspaceEmptyState({ create }: { create: (input: CreateWorkspaceInput) => Promise<Workspace> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-12">
      <Logo />
      <EmptyState
        className="flex-1"
        visual={
          <span className="flex size-16 items-center justify-center rounded-full bg-surface text-muted">
            <Building2 className="size-6" aria-hidden />
          </span>
        }
        title={t.workspace.empty.title}
        description={t.workspace.empty.text}
        actions={
          <Button variant="inverse" className="h-[42px]" onClick={() => setOpen(true)}>
            {t.workspace.empty.cta}
          </Button>
        }
      />
      <CreateWorkspaceModal open={open} onClose={() => setOpen(false)} create={create} />
    </div>
  );
}
