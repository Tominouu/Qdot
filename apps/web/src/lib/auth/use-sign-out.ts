"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { signOut } from "@/lib/api/auth";
import { useI18n } from "@/lib/i18n/provider";
import { setActiveWorkspaceId } from "@/lib/workspace/store";
import { clearSession } from "./session";

export function useSignOut() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  return async () => {
    try {
      await signOut();
    } catch {
      // Even if the request fails, drop the local session cache.
    }
    clearSession();
    // The next account on this browser starts from its own workspaces.
    setActiveWorkspaceId(null);
    toast(t.nav.signedOut, "info");
    router.push("/sign-in");
  };
}
