"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import { useCan } from "@/lib/workspace/provider";
import { cn } from "@/lib/utils/cn";
import { MOBILE_TABS, isActive, type NavItem } from "./nav-items";

function Tab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.match);
  const Icon = item.icon;
  const { t } = useI18n();
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-[color,transform] duration-150 active:scale-90",
        active ? "font-semibold text-fg-strong" : "text-subtle hover:text-fg",
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      {t.nav[item.label]}
    </Link>
  );
}

/** Bottom navigation for < lg screens (mobile-analytics / mobile-qr-library frames). */
export function MobileTabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const canCreate = useCan("qr:write");
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur select-none lg:hidden vt-tabbar"
    >
      <div className="relative mx-auto flex h-[68px] max-w-lg items-center px-2">
        {MOBILE_TABS.left.map((t) => (
          <Tab key={t.href} item={t} pathname={pathname} />
        ))}
        <div className="flex w-20 justify-center">
          {canCreate && (
          <Link
            href="/qr-codes/new"
            aria-label={t.nav.createQr}
            className="-mt-9 flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_16px_rgba(232,80,58,0.45)] transition-transform hover:bg-accent-hover active:scale-95"
          >
            <Plus className="size-6" aria-hidden />
          </Link>
          )}
        </div>
        {MOBILE_TABS.right.map((t) => (
          <Tab key={t.href} item={t} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
