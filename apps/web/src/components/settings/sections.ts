export const SETTINGS_SECTIONS = ["profile", "workspace", "domains", "analytics", "privacy", "api", "team", "billing"] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
