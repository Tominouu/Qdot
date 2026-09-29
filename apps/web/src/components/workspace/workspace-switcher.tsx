"use client";

import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";
import { useWorkspace } from "@/lib/workspace/provider";
import type { Workspace } from "@/types";
import { CreateWorkspaceModal } from "./create-workspace-modal";

/** Initial tile, a stable color per workspace so they're recognizable at a glance. */
function WorkspaceAvatar({ workspace, className }: { workspace: Workspace; className?: string }) {
  const hues = [8, 28, 145, 200, 262, 320];
  const hue = hues[[...workspace.id].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return (
    <span
      aria-hidden
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-md font-display text-xs font-extrabold text-white", className)}
      style={{ background: `hsl(${hue} 55% 42%)` }}
    >
      {workspace.name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/** "ACME ▾": lists the user's workspaces, switches, creates, links to settings. */
export function WorkspaceSwitcher({ compact, className }: { compact?: boolean; className?: string }) {
  const { workspaces, current, select, create } = useWorkspace();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.workspace.switcher}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-line bg-surface text-left transition-colors hover:border-line-strong",
          compact ? "h-9 max-w-[180px] px-2" : "px-2.5 py-2",
        )}
      >
        <WorkspaceAvatar workspace={current} className={compact ? "size-6" : undefined} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold text-fg">{current.name}</span>
          {!compact && <span className="truncate text-[11px] text-subtle">{t.workspace.roles[current.role]}</span>}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute z-50 mt-2 flex w-64 animate-fade-up flex-col rounded-xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/50",
            compact ? "right-0" : "left-0",
          )}
        >
          <div className="max-h-72 overflow-y-auto">
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                role="menuitemradio"
                aria-checked={w.id === current.id}
                onClick={() => {
                  setOpen(false);
                  select(w.id);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-raised"
              >
                <WorkspaceAvatar workspace={w} />
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-[13px] font-semibold text-fg">{w.name}</span>
                  <span className="truncate text-[11px] text-subtle">
                    {t.workspace.roles[w.role]} · {t.workspace.memberCount(w.memberCount)}
                  </span>
                </span>
                {w.id === current.id && <Check className="size-4 shrink-0 text-accent" aria-hidden />}
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setCreating(true);
            }}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-semibold text-fg transition-colors hover:bg-surface-raised"
          >
            <span className="flex size-7 items-center justify-center rounded-md border border-dashed border-line-strong text-muted">
              <Plus className="size-3.5" aria-hidden />
            </span>
            {t.workspace.newWorkspace}
          </button>
          <Link
            role="menuitem"
            href="/settings/workspace"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-raised hover:text-fg"
          >
            <span className="flex size-7 items-center justify-center">
              <Settings className="size-4" aria-hidden />
            </span>
            {t.workspace.settings}
          </Link>
        </div>
      )}

      <CreateWorkspaceModal open={creating} onClose={() => setCreating(false)} create={create} />
    </div>
  );
}

export { WorkspaceAvatar };
