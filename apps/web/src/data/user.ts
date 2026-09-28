import type { PrivacySettings, User } from "@/types";

export const CURRENT_USER: User = {
  id: "usr_alex",
  name: "Alex Rivera",
  email: "alex@qdot.io",
  avatarUrl: "/avatars/alex-rivera.png",
  createdAt: "2026-01-12T09:00:00.000Z",
};

export const PRIVACY_SETTINGS: PrivacySettings = {
  trackScans: true,
  storeIpAddresses: false,
  geolocationPrecision: "city",
  dataRetentionDays: 30,
  cookieConsent: false,
};
