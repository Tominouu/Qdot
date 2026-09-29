"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { signIn, signInWithGoogle, signUp } from "@/lib/api/auth";
import { useI18n } from "@/lib/i18n/provider";
import { legalHref } from "@/lib/legal";
import { CredentialsForm } from "./credentials-form";
import { GoogleButton } from "./google-button";
import { useAuthFlow } from "./use-auth-flow";

export function AuthDivider() {
  const { t } = useI18n();
  return (
    <div className="flex w-full items-center gap-4" role="separator" aria-label={t.common.or}>
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium text-faint uppercase">{t.common.or}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Google button + divider + email/password form, shared by sign-up and sign-in. */
export function AuthPanel({ mode }: { mode: "sign-up" | "sign-in" }) {
  const { t } = useI18n();
  const { busy, error, run } = useAuthFlow(mode === "sign-up" ? t.auth.accountCreated : t.auth.signedIn);
  const c = t.auth.consent;
  const legalLink = "font-medium text-muted-2 underline underline-offset-2 hover:text-fg";

  return (
    <div className="flex w-full flex-col gap-6">
      <GoogleButton loading={busy === "google"} disabled={busy !== null} onClick={() => run("google", signInWithGoogle)} />
      <AuthDivider />
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      <CredentialsForm
        mode={mode}
        busy={busy === "form"}
        disabled={busy !== null}
        onSubmit={(credentials) => run("form", () => (mode === "sign-up" ? signUp(credentials) : signIn(credentials)))}
      />
      {mode === "sign-up" && (
        <p className="text-center text-xs leading-relaxed text-subtle">
          {c.before}
          <Link href={legalHref("terms")} target="_blank" className={legalLink}>
            {c.terms}
          </Link>
          {c.middle}
          <Link href={legalHref("privacy")} target="_blank" className={legalLink}>
            {c.privacy}
          </Link>
          {c.after}
        </p>
      )}
    </div>
  );
}
