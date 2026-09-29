"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";
import type { Credentials } from "@/types";
import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword } from "./auth-validation";
import { PasswordInput } from "./password-input";

interface CredentialsFormProps {
  mode: "sign-up" | "sign-in";
  busy: boolean;
  disabled?: boolean;
  onSubmit: (credentials: Credentials) => void;
}

/** Email + password form. Purely presentational: the caller decides what submitting does. */
export function CredentialsForm({ mode, busy, disabled, onSubmit }: CredentialsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const { t } = useI18n();

  const emailError = touched.email ? validateEmail(email, t) : null;
  const passwordError = touched.password ? validatePassword(password, mode, t) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (validateEmail(email, t) || validatePassword(password, mode, t)) return;
    onSubmit({ email: email.trim(), password });
  };

  const fieldLabel = "text-[13px] font-medium text-muted";

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col gap-4">
      <Field label={t.auth.email} error={emailError ?? undefined} labelClassName={fieldLabel}>
        {(id, describedBy) => (
          <Input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t.auth.emailPlaceholder}
            value={email}
            disabled={busy}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={describedBy}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && setTouched((t) => ({ ...t, email: true }))}
            className="h-12 md:h-10"
          />
        )}
      </Field>

      <div className="flex flex-col gap-1.5">
        <Field
          label={t.auth.password}
          error={passwordError ?? undefined}
          hint={mode === "sign-up" && !passwordError ? t.auth.minChars(MIN_PASSWORD_LENGTH) : undefined}
          labelClassName={fieldLabel}
        >
          {(id, describedBy) => (
            <PasswordInput
              id={id}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              placeholder={mode === "sign-up" ? t.auth.createPassword : t.auth.yourPassword}
              value={password}
              disabled={busy}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={describedBy}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => password && setTouched((t) => ({ ...t, password: true }))}
              className="h-12 md:h-10"
            />
          )}
        </Field>
        {mode === "sign-in" && (
          <Link href="/forgot-password" className="self-end text-[13px] font-medium text-muted transition-colors hover:text-fg">
            {t.auth.forgot}
          </Link>
        )}
      </div>

      <Button
        type="submit"
        className="mt-2 h-12 w-full md:h-[42px]"
        disabled={busy || disabled}
        aria-busy={busy}
        leadingIcon={busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : undefined}
      >
        {busy ? (mode === "sign-up" ? t.auth.creatingAccount : t.auth.signingIn) : mode === "sign-up" ? t.auth.createAccount : t.auth.signIn}
      </Button>
    </form>
  );
}
