import type { PrivacySettings, User } from "@/types";

export const CURRENT_USER: User = {
  id: "usr_alex",
  name: "Alex Rivera",
  email: "alex@qdot.io",
  avatarUrl: "/avatars/alex-rivera.png",
};

export const PRIVACY_SETTINGS: PrivacySettings = {
  trackScans: true,
  storeIpAddresses: false,
  geolocationPrecision: "city",
  dataRetentionDays: 30,
  cookieConsent: false,
};
