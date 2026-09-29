"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { REPO_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";

/** Section anchors live on the landing page; from other pages (legal) they navigate back to it. */
const NAV = [
  { key: "features", href: "/#features" },
  { key: "pricing", href: "/#open-source" },
  { key: "docs", href: "/#flow" },
  { key: "github", href: REPO_URL },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 md:px-10 md:py-5 xl:px-20">
        <Logo />
        <nav aria-label={t.nav.primary} className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-muted">
            {NAV.map((n) => (
              <li key={n.key}>
                <a href={n.href} className="transition-colors hover:text-fg">
                  {t.marketing.nav[n.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          <Link href="/sign-in" className="text-sm font-medium text-fg transition-colors hover:text-white">
            {t.marketing.signIn}
          </Link>
          <ButtonLink href="/onboarding" className="h-[42px] text-white">
            {t.marketing.getStarted}
          </ButtonLink>
        </div>
        <button
          type="button"
          aria-label={open ? t.marketing.closeMenu : t.marketing.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="flex size-9 items-center justify-center rounded-lg bg-surface text-fg md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>
      <div
        id="mobile-menu"
        hidden={!open}
        className={cn("border-t border-line bg-bg px-4 pt-2 pb-6 md:hidden", open && "animate-fade-up")}
      >
        <ul className="flex flex-col">
          {NAV.map((n) => (
            <li key={n.key}>
              <a href={n.href} onClick={() => setOpen(false)} className="block py-3 text-base font-medium text-muted hover:text-fg">
                {t.marketing.nav[n.key]}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ButtonLink href="/sign-in" variant="neutral">
            {t.marketing.signIn}
          </ButtonLink>
          <ButtonLink href="/onboarding">{t.marketing.getStarted}</ButtonLink>
        </div>
        <LanguageSwitcher className="mt-4" />
      </div>
    </header>
  );
}
