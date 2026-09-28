import type { QRContentType } from "@/types";

export interface ContentTypeConfig {
  value: QRContentType;
  label: string;
  fieldLabel: string;
  placeholder: string;
  inputType: "url" | "email" | "tel" | "text";
  /** Validates raw input; returns an error message or null. */
  validate: (raw: string) => string | null;
  /** Normalizes raw input into the destination the redirect service resolves to. */
  toDestination: (raw: string) => string;
  /** Inverse of toDestination, for editing an existing code. */
  fromDestination: (destination: string) => string;
}

const required = (label: string) => (raw: string) => (raw.trim() ? null : `${label} is required`);

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    value: "url",
    label: "URL",
    fieldLabel: "URL",
    placeholder: "https://example.com",
    inputType: "url",
    validate: (raw) => {
      if (!raw.trim()) return "Destination URL is required";
      try {
        const u = new URL(raw.trim());
        return u.protocol === "http:" || u.protocol === "https:" ? null : "Use an http(s) URL";
      } catch {
        return "Enter a valid URL, e.g. https://example.com";
      }
    },
    toDestination: (raw) => raw.trim(),
    fromDestination: (d) => d,
  },
  {
    value: "vcard",
    label: "vCard",
    fieldLabel: "Contact name",
    placeholder: "Alex Rivera",
    inputType: "text",
    validate: required("Contact name"),
    toDestination: (raw) => `BEGIN:VCARD\nVERSION:3.0\nFN:${raw.trim()}\nEND:VCARD`,
    fromDestination: (d) => /FN:(.*)/.exec(d)?.[1] ?? "",
  },
  {
    value: "wifi",
    label: "Wi-Fi",
    fieldLabel: "Network name (SSID)",
    placeholder: "Qdot-Guest",
    inputType: "text",
    validate: required("Network name"),
    toDestination: (raw) => `WIFI:T:WPA;S:${raw.trim()};;`,
    fromDestination: (d) => /S:([^;]*)/.exec(d)?.[1] ?? "",
  },
  {
    value: "email",
    label: "Email",
    fieldLabel: "Email address",
    placeholder: "hello@example.com",
    inputType: "email",
    validate: (raw) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) ? null : "Enter a valid email address"),
    toDestination: (raw) => `mailto:${raw.trim()}`,
    fromDestination: (d) => d.replace(/^mailto:/, ""),
  },
  {
    value: "sms",
    label: "SMS",
    fieldLabel: "Phone number",
    placeholder: "+33 6 12 34 56 78",
    inputType: "tel",
    validate: (raw) => (/^\+?[\d\s().-]{6,}$/.test(raw.trim()) ? null : "Enter a valid phone number"),
    toDestination: (raw) => `sms:${raw.replace(/[^\d+]/g, "")}`,
    fromDestination: (d) => d.replace(/^sms:/, ""),
  },
  {
    value: "phone",
    label: "Phone",
    fieldLabel: "Phone number",
    placeholder: "+33 6 12 34 56 78",
    inputType: "tel",
    validate: (raw) => (/^\+?[\d\s().-]{6,}$/.test(raw.trim()) ? null : "Enter a valid phone number"),
    toDestination: (raw) => `tel:${raw.replace(/[^\d+]/g, "")}`,
    fromDestination: (d) => d.replace(/^tel:/, ""),
  },
];

export function contentTypeConfig(type: QRContentType): ContentTypeConfig {
  return CONTENT_TYPES.find((t) => t.value === type) ?? CONTENT_TYPES[0];
}
