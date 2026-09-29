"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/i18n/errors";
import { useI18n } from "@/lib/i18n/provider";
import { setSession } from "@/lib/auth/session";
import { completeOnboarding } from "@/lib/onboarding/pending-qr";
import type { AuthSession } from "@/types";

type Busy = "form" | "google" | null;

/** `?next=/qr-codes/…` from the sign-in redirect; only same-site paths are honored. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/qr-codes";
}

/**
 * Runs an auth action, stores the session, saves any QR code pending from
 * onboarding, then navigates (Done screen, or the dashboard when nothing is pending).
 */
export function useAuthFlow(successMessage: string) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<AuthSession>) => {
    setBusy(kind);
    setError(null);
    try {
      setSession(await action());
      const next = await completeOnboarding(nextPath());
      toast(successMessage);
      router.push(next);
      // Keep `busy` until the route changes so buttons can't be re-submitted.
    } catch (err) {
      setError(errorMessage(err, t));
      setBusy(null);
    }
  };

  return { busy, error, run };
}
