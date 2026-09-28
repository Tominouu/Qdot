"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { OnboardingHeading, OnboardingShell, OnboardingStepper } from "@/components/onboarding/onboarding-shell";
import { usePendingQR } from "@/lib/onboarding/pending-qr";

export const ACCOUNT_STEP_INDEX = 3;

interface AuthScreenProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  /** "Already have an account? Sign in" style line under the form. */
  footer?: ReactNode;
  /** Secondary navigation link shown at the bottom. */
  back?: { href: string; label: string };
}

/**
 * Onboarding-styled page for account screens. When a QR code is pending from
 * onboarding, the stepper shows the Account step.
 */
export function AuthScreen({ title, description, children, footer, back }: AuthScreenProps) {
  const pending = usePendingQR();
  return (
    <OnboardingShell>
      {pending ? <OnboardingStepper current={ACCOUNT_STEP_INDEX} /> : pending === undefined ? <div className="h-[18px]" aria-hidden /> : null}
      <div className="flex w-full max-w-[400px] animate-fade-up flex-col items-center gap-8">
        <OnboardingHeading title={title} description={description} />
        {children}
        {footer && <p className="text-center text-sm text-muted">{footer}</p>}
        {back && (
          <Link href={back.href} className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg">
            <ArrowLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
      </div>
    </OnboardingShell>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-fg-strong underline-offset-4 transition-colors hover:underline">
      {children}
    </Link>
  );
}
