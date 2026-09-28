import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { formatDelta } from "@/lib/utils/format";
import type { QRStatus } from "@/types";

const STATUS: Record<QRStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-success bg-success/10 text-success" },
  paused: { label: "Paused", className: "border-warning bg-warning/10 text-warning" },
  archived: { label: "Archived", className: "border-subtle bg-subtle/10 text-subtle" },
  draft: { label: "Draft", className: "border-line-strong bg-surface-raised text-muted" },
};

/** Outlined status pill with a dot (library cards, detail header). */
export function StatusBadge({ status, className }: { status: QRStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] leading-none font-semibold",
        s.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}

/** Solid neutral pill ("Active" on campaign cards, compliance badges, "Live"). */
export function Pill({ children, tone = "default", className }: { children: ReactNode; tone?: "default" | "muted"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs leading-none font-semibold",
        tone === "default" ? "bg-white/10 text-white" : "bg-[#b4b4b4]/10 text-[#b4b4b4]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small change chip next to a KPI ("+24.1%"). */
export function DeltaBadge({
  value,
  label,
  tone = "positive",
}: {
  value?: number;
  label?: string;
  tone?: "positive" | "neutral";
}) {
  const negative = value !== undefined && value < 0;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] leading-none font-semibold",
        tone === "neutral" ? "bg-white/10 text-white" : negative ? "bg-danger/10 text-danger" : "bg-success/10 text-success",
      )}
    >
      {label ?? (value !== undefined ? formatDelta(value) : null)}
    </span>
  );
}
