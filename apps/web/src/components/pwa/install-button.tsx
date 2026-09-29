"use client";

import { MonitorDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { usePwa } from "@/lib/pwa/provider";
import { cn } from "@/lib/utils/cn";

/**
 * "Install app": the browser's own dialog on Chrome/Edge/Android, the
 * Share-sheet steps on iOS. Renders nothing once installed or when the
 * browser can't install (Firefox desktop, already dismissed, …).
 */
export function InstallAppButton({ variant = "full", className }: { variant?: "full" | "icon" | "link"; className?: string }) {
  const { canInstall, install } = usePwa();
  const { t } = useI18n();
  if (!canInstall) return null;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={install}
        aria-label={t.pwa.install}
        title={t.pwa.install}
        className={cn("flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-fg", className)}
      >
        <MonitorDown className="size-4" aria-hidden />
      </button>
    );
  }

  if (variant === "link") {
    return (
      <button type="button" onClick={install} className={cn("inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg", className)}>
        <MonitorDown className="size-4" aria-hidden />
        {t.pwa.installShort}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={install}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] font-semibold text-fg transition-colors hover:border-line-strong hover:bg-surface-raised",
        className,
      )}
    >
      <MonitorDown className="size-4 shrink-0 text-accent" aria-hidden />
      {t.pwa.install}
    </button>
  );
}
