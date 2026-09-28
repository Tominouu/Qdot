export * from "./qr";
export * from "./analytics";
export * from "./campaign";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface PrivacySettings {
  trackScans: boolean;
  storeIpAddresses: boolean;
  geolocationPrecision: "country" | "region" | "city";
  dataRetentionDays: 30 | 90 | 365;
  cookieConsent: boolean;
}
