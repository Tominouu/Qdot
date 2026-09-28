import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  visual: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

/** Centered empty state from the "empty-states — v2" frame. */
export function EmptyState({ visual, title, description, actions, className }: EmptyStateProps) {
  return (
    <div className={cn("flex animate-fade-up flex-col items-center justify-center gap-8 px-4 py-16 text-center", className)}>
      {visual}
      <div className="flex max-w-[480px] flex-col gap-3">
        <h2 className="font-display text-2xl font-bold text-fg">{title}</h2>
        <p className="text-[15px] text-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center justify-center gap-4">{actions}</div>}
    </div>
  );
}
