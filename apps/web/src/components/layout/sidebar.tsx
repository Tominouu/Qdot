"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { User } from "@/types";
import { Logo } from "./logo";
import { SIDEBAR_NAV, isActive } from "./nav-items";

export function UserChip({ user, className }: { user: User; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image src={user.avatarUrl} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-semibold text-fg">{user.name}</p>
        <p className="truncate text-[11px] text-muted">{user.email}</p>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-sidebar p-6 lg:flex">
      <Logo href="/qr-codes" />
      <nav aria-label="Main" className="mt-10">
        <ul className="flex flex-col gap-2">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(pathname, item.match);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors duration-150",
                    active
                      ? "border-l-3 border-line bg-surface pl-3 font-semibold text-fg-strong"
                      : "font-medium text-subtle hover:bg-surface/60 hover:text-fg",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto border-t border-line pt-4">
        <UserChip user={user} />
      </div>
    </aside>
  );
}
