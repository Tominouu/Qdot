import type { PrivacySettings } from "@/types";
import { delay, readStore, writeStore } from "./mock-store";

/**
 * Privacy preferences. The backend has no settings endpoint yet, so these are
 * stored in the browser in every mode. The API already applies the privacy-first
 * defaults (no raw IPs, no cookies for scanners).
 */
export async function getPrivacySettings(): Promise<PrivacySettings> {
  return delay(readStore().privacy);
}

export async function updatePrivacySettings(patch: Partial<PrivacySettings>): Promise<PrivacySettings> {
  writeStore((s) => {
    s.privacy = { ...s.privacy, ...patch };
  });
  return delay(readStore().privacy);
}
