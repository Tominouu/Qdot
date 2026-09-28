"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SETTINGS_SECTIONS } from "./sections";

export function SettingsNav() {
  const pathname = usePathname();
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
      </ul>
    </nav>
  );
}
