import { Fragment, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils/cn";

export const ONBOARDING_STEPS = ["01 Create", "02 Customize", "03 Destination", "04 Account", "05 Done"] as const;

/** Centered onboarding page: logo on top, content column below (onboarding-page — v2). */
export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-12 pb-10 md:pt-[60px]">
      <Logo />
      <main className="flex w-full max-w-[640px] flex-1 flex-col items-center gap-10 pt-10 md:gap-12 md:pt-[60px]">
        {children}
      </main>
    </div>
  );
}

/** "01 Create — 02 Customize — …" on ≥ md, compact dashes on mobile. `current` is 0-based. */
export function OnboardingStepper({ current }: { current: number }) {
  const label = `Step ${current + 1} of ${ONBOARDING_STEPS.length}: ${ONBOARDING_STEPS[current].slice(3)}`;
  return (
    <>
      <ol aria-label="Progress" className="hidden items-center gap-6 whitespace-nowrap md:flex">
        {ONBOARDING_STEPS.map((s, i) => (
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
            {i < ONBOARDING_STEPS.length - 1 && <li aria-hidden className="-mx-3 h-px w-5 bg-line" />}
          </Fragment>
        ))}
      </ol>
      <div className="flex gap-2 md:hidden" role="img" aria-label={label}>
        {ONBOARDING_STEPS.map((s, i) => (
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
