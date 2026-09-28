import type { ReactNode } from "react";
import { DeltaBadge } from "@/components/ui/badge";
import { Card, Eyebrow } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { Sparkline } from "./sparkline";

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: number;
  /** Replaces the computed delta text ("42% Share"). */
  deltaLabel?: string;
  /** `neutral` = white chip used on the campaign screen. */
  deltaTone?: "positive" | "neutral";
  icon?: ReactNode;
  footnote?: string;
  sparkline?: number[];
  size?: "md" | "sm";
  className?: string;
}

export function StatCard({ label, value, delta, deltaLabel, deltaTone, icon, footnote, sparkline, size = "md", className }: StatCardProps) {
  return (
    <Card className={cn("flex min-w-0 flex-col gap-3", size === "md" ? "p-6" : "p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <Eyebrow className={cn("truncate", size === "sm" && "text-[11px]")}>{label}</Eyebrow>
        {icon && <span className="text-muted-2 [&_svg]:size-4" aria-hidden>{icon}</span>}
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={cn("font-display leading-none font-black text-fg-strong tabular-nums", size === "md" ? "text-[32px]" : "text-2xl")}>
          {value}
        </p>
        {(delta !== undefined || deltaLabel) && <DeltaBadge value={delta} label={deltaLabel} tone={deltaTone} />}
      </div>
      {sparkline && <Sparkline values={sparkline} />}
      {footnote && <p className="text-xs text-subtle">{footnote}</p>}
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-4 p-6", className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </Card>
  );
}
