import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Page title block: Archivo Black 32px + muted description, actions on the right. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[28px] leading-tight font-black text-fg-strong md:text-[32px]">{title}</h1>
        {description && <p className="text-sm text-subtle">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 md:gap-4">{actions}</div>}
    </div>
  );
}
