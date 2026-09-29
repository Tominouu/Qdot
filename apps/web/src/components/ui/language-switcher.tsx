"use client";

import { Languages } from "lucide-react";
import { LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";

/** EN / FR toggle. The choice is kept in a preference cookie and applied to the whole site. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();
  return (
    <div role="group" aria-label={t.language.label} className={cn("inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5", className)}>
      <Languages className="mx-1 size-3.5 text-muted" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          aria-label={t.language.name[l]}
          title={t.language.name[l]}
          onClick={() => locale !== l && setLocale(l)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] leading-none font-semibold transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg-strong",
            locale === l ? "bg-surface-raised text-fg-strong" : "text-subtle hover:text-fg",
          )}
        >
          {t.language.short[l]}
        </button>
      ))}
    </div>
  );
}
