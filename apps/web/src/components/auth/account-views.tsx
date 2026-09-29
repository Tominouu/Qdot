"use client";

import { AlertTriangle, Loader2, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PendingQRSummary, RESUME_EDITOR_HREF } from "@/components/onboarding/pending-qr-summary";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { requestPasswordReset } from "@/lib/api/auth";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import { usePendingQR } from "@/lib/onboarding/pending-qr";
import { AuthPanel } from "./auth-panel";
import { AuthScreen, TextLink } from "./auth-screen";
import { validateEmail } from "./auth-validation";

const ACCOUNT_HREF = "/onboarding/account";

/** Onboarding step 04 — create an account to save the configured QR code. */
export function SignUpView() {
  const pending = usePendingQR();
  const { t } = useI18n();
  const s = t.auth.signUp;
  return (
    <AuthScreen
      title={pending === null ? s.title : s.titlePending}
      description={pending === null ? s.description : s.descriptionPending}
      footer={
        <>
          {s.haveAccount} <TextLink href="/sign-in">{t.auth.signIn}</TextLink>
        </>
      }
      back={pending ? { href: RESUME_EDITOR_HREF, label: s.backToQr } : undefined}
    >
      {pending === undefined ? <Skeleton className="h-[82px] w-full rounded-2xl" /> : pending && <PendingQRSummary pending={pending} />}
      <AuthPanel mode="sign-up" />
    </AuthScreen>
  );
}

export function SignInView() {
  const pending = usePendingQR();
  const { t } = useI18n();
  const s = t.auth.signInView;
  return (
    <AuthScreen
      title={s.title}
      description={pending ? s.descriptionPending : s.description}
      footer={
        <>
          {s.noAccount} <TextLink href={ACCOUNT_HREF}>{s.createOne}</TextLink>
        </>
      }
      back={pending ? { href: ACCOUNT_HREF, label: s.returnOnboarding } : { href: "/", label: s.backHome }}
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
  const { t } = useI18n();
  const f = t.auth.forgotView;
  const error = touched ? validateEmail(email, t) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (validateEmail(email, t)) return;
    setStatus("sending");
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setStatus("sent");
    } catch (err) {
      setError(errorMessage(err, t));
      setStatus("idle");
    }
  };

  const back = pending ? { href: ACCOUNT_HREF, label: t.auth.signInView.returnOnboarding } : undefined;

  if (status === "sent") {
    return (
      <AuthScreen
        title={f.sentTitle}
        description={
          <>
            {f.sentBefore}
            <span className="font-semibold text-fg">{email.trim()}</span>
            {f.sentAfter}
          </>
        }
        back={back}
      >
        <span className="flex size-14 animate-pop items-center justify-center rounded-full bg-surface text-fg-strong" aria-hidden>
          <MailCheck className="size-6" />
        </span>
        <div className="flex w-full flex-col gap-3">
          <ButtonLink href="/sign-in" variant="inverse" className="h-12 w-full md:h-[42px]">
            {f.backToSignIn}
          </ButtonLink>
          <Button variant="ghost" className="h-12 w-full md:h-[42px]" onClick={() => setStatus("idle")}>
            {f.differentEmail}
          </Button>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={f.title}
      description={f.description}
      footer={
        <>
          {f.remembered} <TextLink href="/sign-in">{f.backToSignIn}</TextLink>
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
        <Field label={t.auth.email} error={error ?? undefined} labelClassName="text-[13px] font-medium text-muted">
          {(id, describedBy) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
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
          {status === "sending" ? f.sending : f.send}
        </Button>
      </form>
    </AuthScreen>
  );
}
