"use client";

import { AlertTriangle, Loader2, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PendingQRSummary, RESUME_EDITOR_HREF } from "@/components/onboarding/pending-qr-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { requestPasswordReset } from "@/lib/api/auth";
import { usePendingQR } from "@/lib/onboarding/pending-qr";
import { AuthPanel } from "./auth-panel";
import { AuthScreen, TextLink } from "./auth-screen";
import { validateEmail } from "./auth-validation";

const ACCOUNT_HREF = "/onboarding/account";

/** Onboarding step 04 — create an account to save the configured QR code. */
export function SignUpView() {
  const pending = usePendingQR();
  return (
    <AuthScreen
      title={pending === null ? "Create your account." : "Save your QR code."}
      description={
        pending === null
          ? "Create a free Qdot account to manage your QR codes and access scan analytics."
          : "Create a free Qdot account to save it, update it anytime, and see who scans it."
      }
      footer={
        <>
          Already have an account? <TextLink href="/sign-in">Sign in</TextLink>
        </>
      }
      back={pending ? { href: RESUME_EDITOR_HREF, label: "Back to your QR code" } : undefined}
    >
      {pending === undefined ? <Skeleton className="h-[82px] w-full rounded-2xl" /> : pending && <PendingQRSummary pending={pending} />}
      <AuthPanel mode="sign-up" />
    </AuthScreen>
  );
}

export function SignInView() {
  const pending = usePendingQR();
  return (
    <AuthScreen
      title="Welcome back."
      description={pending ? "Sign in to save your QR code to your workspace." : "Sign in to manage your QR codes and analytics."}
      footer={
        <>
          Don&apos;t have an account? <TextLink href={ACCOUNT_HREF}>Create one</TextLink>
        </>
      }
      back={pending ? { href: ACCOUNT_HREF, label: "Return to onboarding" } : { href: "/", label: "Back to home" }}
    >
      <AuthPanel mode="sign-in" />
    </AuthScreen>
  );
}

export function ForgotPasswordView() {
  const pending = usePendingQR();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [requestError, setError] = useState<string | null>(null);
  const error = touched ? validateEmail(email) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    setStatus("sending");
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  const back = pending ? { href: ACCOUNT_HREF, label: "Return to onboarding" } : undefined;

  if (status === "sent") {
    return (
      <AuthScreen
        title="Check your inbox."
        description={
          <>
            If an account exists for <span className="font-semibold text-fg">{email.trim()}</span>, a reset link is on its way.
          </>
        }
        back={back}
      >
        <span className="flex size-14 animate-pop items-center justify-center rounded-full bg-surface text-fg-strong" aria-hidden>
          <MailCheck className="size-6" />
        </span>
        <div className="flex w-full flex-col gap-3">
          <ButtonLink href="/sign-in" variant="inverse" className="h-12 w-full md:h-[42px]">
            Back to sign in
          </ButtonLink>
          <Button variant="ghost" className="h-12 w-full md:h-[42px]" onClick={() => setStatus("idle")}>
            Use a different email
          </Button>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset your password."
      description="Enter your email and we'll send you a link to reset your password."
      footer={
        <>
          Remembered it? <TextLink href="/sign-in">Back to sign in</TextLink>
        </>
      }
      back={back}
    >
      <form noValidate onSubmit={submit} className="flex w-full flex-col gap-4">
        {requestError && (
          <p role="alert" className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {requestError}
          </p>
        )}
        <Field label="Email" error={error ?? undefined} labelClassName="text-[13px] font-medium text-muted">
          {(id, describedBy) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              disabled={status === "sending"}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => email && setTouched(true)}
              className="h-12 md:h-10"
            />
          )}
        </Field>
        <Button
          type="submit"
          className="mt-2 h-12 w-full md:h-[42px]"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
          leadingIcon={status === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined}
        >
          {status === "sending" ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthScreen>
  );
}
