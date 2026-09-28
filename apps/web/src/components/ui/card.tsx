import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface", className)} {...props} />;
}

/** Card heading in Archivo ExtraBold 18px ("Performance History", "System Information"). */
export function CardTitle({ className, as: Tag = "h2", ...props }: ComponentProps<"h2"> & { as?: "h2" | "h3" }) {
  return <Tag className={cn("font-display text-lg leading-tight font-extrabold text-fg-strong", className)} {...props} />;
}

/** Uppercase caption used for KPI labels and card sub-sections. */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[13px] font-semibold tracking-normal text-subtle uppercase", className)} {...props} />;
}

export function SectionHeading({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="font-display text-xl font-extrabold text-fg">{title}</h2>
      {action}
    </div>
  );
}
