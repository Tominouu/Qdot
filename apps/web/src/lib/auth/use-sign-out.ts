"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { signOut } from "@/lib/api/auth";
import { clearSession } from "./session";

export function useSignOut() {
  const router = useRouter();
  const { toast } = useToast();
  return async () => {
    try {
      await signOut();
    } catch {
      // Even if the request fails, drop the local session cache.
    }
    clearSession();
    toast("Signed out", "info");
    router.push("/sign-in");
  };
}
