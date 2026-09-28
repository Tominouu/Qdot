import { CURRENT_USER } from "@/data/user";
import { USE_MOCK_API } from "@/lib/config";
import type { PrivacySettings, User } from "@/types";
import { apiRequest } from "./client";
import { delay, readStore, writeStore } from "./mock-store";

export async function getCurrentUser(): Promise<User> {
  if (!USE_MOCK_API) return apiRequest<User>("/me");
  return CURRENT_USER;
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  if (!USE_MOCK_API) return apiRequest<PrivacySettings>("/settings/privacy");
  return delay(readStore().privacy);
}

export async function updatePrivacySettings(patch: Partial<PrivacySettings>): Promise<PrivacySettings> {
  if (!USE_MOCK_API)
    return apiRequest<PrivacySettings>("/settings/privacy", { method: "PATCH", body: JSON.stringify(patch) });
  writeStore((s) => {
    s.privacy = { ...s.privacy, ...patch };
  });
  return delay(readStore().privacy);
}
