import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-white", className)}>
      <span className="flex size-4 items-center justify-center rounded-[4px] bg-bg">
        <span className="size-1.5 rounded-[1px] bg-fg" />
      </span>
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-md", className)} aria-label="Qdot">
      <LogoMark />
      <span className="font-display text-xl font-extrabold text-fg">Qdot</span>
    </Link>
  );
}
