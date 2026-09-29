"use client";

import { createQRCode } from "@/lib/api/qr";
import { createStorageStore } from "@/lib/utils/storage-store";
import type { PendingQRCode } from "@/types";

/**
 * The QR code being built during onboarding, held in sessionStorage so it
 * survives navigation between Account, Sign in, Forgot password and back to
 * the editor (and reloads) within the tab.
 */
const store = createStorageStore<PendingQRCode>("session", "qdot.onboarding.pending-qr.v2");

export const savePendingQR = (value: Omit<PendingQRCode, "savedAt">) => store.set({ ...value, savedAt: new Date().toISOString() });
export const clearPendingQR = store.clear;
/** `undefined` while hydrating, `null` when nothing is pending. */
export const usePendingQR = store.useValue;

/**
 * Called right after authentication. Saves the pending QR code (if any) and
 * returns where the user should land next.
 */
export async function completeOnboarding(fallback = "/qr-codes"): Promise<string> {
  const pending = store.get();
  if (!pending) return fallback;
  const qr = await createQRCode(pending.create);
  store.clear();
  return `/qr-codes/${qr.id}/success`;
}
