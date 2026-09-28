"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/lib/auth/use-sign-out";
import { cn } from "@/lib/utils/cn";
import { SETTINGS_SECTIONS } from "./sections";

export function SettingsNav() {
  const pathname = usePathname();
  const signOut = useSignOut();
  return (
    <nav aria-label="Settings" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:w-[220px] lg:shrink-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1.5 lg:flex-col">
        {SETTINGS_SECTIONS.map((s) => {
          const active = pathname === `/settings/${s.slug}`;
          return (
            <li key={s.slug}>
              <Link
                href={`/settings/${s.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-lg border px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                  active ? "border-line bg-surface font-semibold text-fg" : "border-transparent font-medium text-muted hover:bg-surface/60 hover:text-fg",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-surface/60 hover:text-fg"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
