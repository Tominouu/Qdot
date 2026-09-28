// API entities and schemas are shared with the backend (packages/types).
export * from "@qdot/types";
export * from "./auth";

export interface PrivacySettings {
  trackScans: boolean;
  storeIpAddresses: boolean;
  geolocationPrecision: "country" | "region" | "city";
  dataRetentionDays: 30 | 90 | 365;
  cookieConsent: boolean;
}
