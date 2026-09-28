import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types";

/** Photo when available, otherwise initials on the raised surface. */
export function Avatar({ user, size = 36, className }: { user: Pick<User, "name" | "avatarUrl">; size?: number; className?: string }) {
  if (user.avatarUrl) {
    return <Image src={user.avatarUrl} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-surface-raised font-display font-bold text-fg ring-1 ring-line", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || "Q"}
    </span>
  );
}
