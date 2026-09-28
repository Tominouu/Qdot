"use client";

import { ArrowRight, Calendar, Check, Coffee, Globe, Smartphone, Sparkles, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { QRCategory } from "@/types";

const OPTIONS: { value: QRCategory; title: string; description: string; icon: LucideIcon }[] = [
  { value: "website", title: "Website", description: "Link to any dynamic URL, portfolio, or landing page.", icon: Globe },
  { value: "menu", title: "Menu", description: "Interactive restaurant and bar menu templates.", icon: Coffee },
  { value: "event", title: "Event", description: "Share ticketing and venue details instantly.", icon: Calendar },
  { value: "social", title: "Social profile", description: "Direct users to your community links.", icon: User },
  { value: "app", title: "App", description: "Auto-detect app store links for mobile downloads.", icon: Smartphone },
  { value: "custom", title: "Custom", description: "Define custom schemas and metadata blocks.", icon: Sparkles },
];

const STEPS = ["01 Create", "02 Customize", "03 Destination", "04 Done"];

export function OnboardingFlow() {
  const router = useRouter();
  const [selected, setSelected] = useState<QRCategory>("website");
  const next = () => router.push(`/qr-codes/new?category=${selected}`);

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-12 pb-10 md:pt-[60px]">
      <Logo />

      <main className="flex w-full max-w-[640px] flex-1 flex-col items-center gap-10 pt-10 md:gap-12 md:pt-[60px]">
        <ol aria-label="Progress" className="hidden items-center gap-6 md:flex">
          {STEPS.map((s, i) => (
            <Fragment key={s}>
              <li aria-current={i === 0 ? "step" : undefined} className={cn("text-sm", i === 0 ? "font-bold text-[#fafaf9]" : "font-medium text-faint")}>
                {s}
              </li>
              {i < STEPS.length - 1 && <li aria-hidden className="-mx-3 h-px w-5 bg-line" />}
            </Fragment>
          ))}
        </ol>
        <div className="flex gap-2 md:hidden" aria-label="Step 1 of 4" role="img">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-[3px] rounded-full", i === 0 ? "w-8 bg-fg-strong" : "w-3 bg-line")} />
          ))}
        </div>

        <div className="flex flex-col gap-3 text-center">
          <h1 className="font-display text-[32px] leading-tight font-extrabold text-fg">What are you creating?</h1>
          <p className="text-[15px] text-muted md:text-base">Select the physical object or digital experience you want to connect.</p>
        </div>

        <div role="radiogroup" aria-label="QR code purpose" className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
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
                  "flex min-h-[120px] animate-fade-up flex-col gap-4 rounded-2xl border bg-surface p-5 text-left transition-[border-color,box-shadow,transform] duration-200 md:h-[140px] md:p-6",
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
                  <span className="font-display text-[15px] font-bold text-fg">{o.title}</span>
                  <span className="hidden text-xs text-muted sm:block">{o.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex w-full flex-col-reverse items-center gap-4 md:mt-0 md:flex-row md:justify-between">
          <Button variant="secondary" className="hidden h-[42px] border-line md:inline-flex" onClick={() => router.back()}>
            Back
          </Button>
          <Link href="/qr-codes/new" className="text-sm text-muted hover:text-fg md:hidden">
            Skip onboarding
          </Link>
          <Button variant="inverse" className="h-12 w-full md:h-[42px] md:w-auto" onClick={next} trailingIcon={<ArrowRight className="size-4" />}>
            Continue
          </Button>
        </div>
      </main>
    </div>
  );
}
