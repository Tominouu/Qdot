import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,#27272a_0%,#323237_50%,#27272a_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
