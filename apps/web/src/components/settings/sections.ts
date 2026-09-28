export const SETTINGS_SECTIONS = [
  { slug: "profile", label: "Profile" },
  { slug: "workspace", label: "Workspace" },
  { slug: "domains", label: "Domains" },
  { slug: "analytics", label: "Analytics" },
  { slug: "privacy", label: "Privacy & Data" },
  { slug: "api", label: "API" },
  { slug: "team", label: "Team" },
  { slug: "billing", label: "Billing" },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["slug"];
