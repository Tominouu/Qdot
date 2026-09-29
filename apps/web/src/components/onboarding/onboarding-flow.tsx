"use client";

import { ArrowRight, Calendar, Check, Coffee, Globe, Smartphone, Sparkles, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";
import type { QRCategory } from "@/types";
import { OnboardingHeading, OnboardingShell, OnboardingStepper } from "./onboarding-shell";

const OPTIONS: { value: QRCategory; icon: LucideIcon }[] = [
  { value: "website", icon: Globe },
  { value: "menu", icon: Coffee },
  { value: "event", icon: Calendar },
  { value: "social", icon: User },
  { value: "app", icon: Smartphone },
  { value: "custom", icon: Sparkles },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [selected, setSelected] = useState<QRCategory>("website");
  const { t } = useI18n();
  const next = () => router.push(`/qr-codes/new?category=${selected}`);

  return (
    <OnboardingShell>
      <OnboardingStepper current={0} />
      <OnboardingHeading title={t.onboarding.title} description={t.onboarding.description} />

      <div role="radiogroup" aria-label={t.onboarding.purpose} className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {OPTIONS.map((o, i) => {
          const active = selected === o.value;
          const Icon = o.icon;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(o.value)}
              onDoubleClick={next}
              onKeyDown={(e) => {
                const cols = window.matchMedia("(min-width: 768px)").matches ? 3 : 2;
                const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
                if (e.key === "Enter") return next();
                if (!delta) return;
                e.preventDefault();
                const j = Math.min(OPTIONS.length - 1, Math.max(0, i + delta));
                setSelected(OPTIONS[j].value);
                (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
              }}
              className={cn(
                "flex min-h-[120px] animate-fade-up flex-col gap-4 rounded-2xl border bg-surface p-5 text-left transition-[border-color,box-shadow,transform] duration-200 md:min-h-[140px] md:p-6",
                "hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-strong",
                active ? "border-white shadow-[0_4px_8px_rgba(255,255,255,0.15)]" : "border-line hover:border-line-strong",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="flex w-full items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-surface-raised text-muted-2">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                {active && <Check className="size-4 animate-pop text-fg-strong" aria-hidden />}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-[15px] font-bold text-fg">{t.onboarding.options[o.value].title}</span>
                <span className="hidden text-xs text-muted sm:block">{t.onboarding.options[o.value].description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex w-full flex-col-reverse items-center gap-4 md:mt-0 md:flex-row md:justify-between">
        <Button variant="secondary" className="hidden h-[42px] border-line md:inline-flex" onClick={() => router.back()}>
          {t.common.back}
        </Button>
        <Link href="/qr-codes/new" className="text-sm text-muted hover:text-fg md:hidden">
          {t.onboarding.skip}
        </Link>
        <Button variant="inverse" className="h-12 w-full md:h-[42px] md:w-auto" onClick={next} trailingIcon={<ArrowRight className="size-4" />}>
          {t.common.continue}
        </Button>
      </div>
    </OnboardingShell>
  );
}
