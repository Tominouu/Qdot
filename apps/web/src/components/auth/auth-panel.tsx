"use client";

import { AlertTriangle } from "lucide-react";
import { signIn, signInWithGoogle, signUp } from "@/lib/api/auth";
import { CredentialsForm } from "./credentials-form";
import { GoogleButton } from "./google-button";
import { useAuthFlow } from "./use-auth-flow";

export function AuthDivider() {
  return (
    <div className="flex w-full items-center gap-4" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium text-faint uppercase">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Google button + divider + email/password form, shared by sign-up and sign-in. */
export function AuthPanel({ mode }: { mode: "sign-up" | "sign-in" }) {
  const { busy, error, run } = useAuthFlow(mode === "sign-up" ? "Account created — welcome to Qdot" : "Signed in");

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
    </div>
  );
}
