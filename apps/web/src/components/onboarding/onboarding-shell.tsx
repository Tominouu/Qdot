"use client";

import { Fragment, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";

/** Centered onboarding page: logo on top, content column below (onboarding-page — v2). */
export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center px-6 pt-12 pb-10 md:pt-[60px]">
      <LanguageSwitcher className="absolute top-4 right-4 md:top-6 md:right-6" />
      <Logo />
      <main className="flex w-full max-w-[640px] flex-1 flex-col items-center gap-10 pt-10 md:gap-12 md:pt-[60px]">
        {children}
      </main>
    </div>
  );
}

/** "01 Create — 02 Customize — …" on ≥ md, compact dashes on mobile. `current` is 0-based. */
export function OnboardingStepper({ current }: { current: number }) {
  const { t } = useI18n();
  const steps = t.onboarding.steps;
  const label = t.onboarding.stepOf(current + 1, steps.length, steps[current].slice(3));
  return (
    <>
      <ol aria-label={t.onboarding.progress} className="hidden items-center gap-6 whitespace-nowrap md:flex">
        {steps.map((s, i) => (
          <Fragment key={s}>
            <li
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "text-sm",
                i === current ? "font-bold text-[#fafaf9]" : i < current ? "font-medium text-muted" : "font-medium text-faint",
              )}
            >
              {s}
            </li>
            {i < steps.length - 1 && <li aria-hidden className="-mx-3 h-px w-5 bg-line" />}
          </Fragment>
        ))}
      </ol>
      <div className="flex gap-2 md:hidden" role="img" aria-label={label}>
        {steps.map((s, i) => (
          <span key={s} className={cn("h-[3px] rounded-full", i === current ? "w-8 bg-fg-strong" : i < current ? "w-3 bg-muted" : "w-3 bg-line")} />
        ))}
      </div>
    </>
  );
}

export function OnboardingHeading({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-center">
      <h1 className="font-display text-[32px] leading-tight font-extrabold text-fg">{title}</h1>
      <p className="text-[15px] text-muted md:text-base">{description}</p>
    </div>
  );
}
