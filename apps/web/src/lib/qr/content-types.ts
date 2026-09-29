import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { QRContentType } from "@/types";

export interface ContentTypeConfig {
  value: QRContentType;
  placeholder: string;
  inputType: "url" | "email" | "tel" | "text";
  /** Validates raw input; returns an error message (in the UI language) or null. */
  validate: (raw: string, t: Dictionary) => string | null;
  /** Normalizes raw input into the destination the redirect service resolves to. */
  toDestination: (raw: string) => string;
  /** Inverse of toDestination, for editing an existing code. */
  fromDestination: (destination: string) => string;
}

const PHONE = /^\+?[\d\s().-]{6,}$/;

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    value: "url",
    placeholder: "https://example.com",
    inputType: "url",
    validate: (raw, t) => {
      const m = t.editor.contentTypes.url;
      if (!raw.trim()) return m.required;
      try {
        const u = new URL(raw.trim());
        return u.protocol === "http:" || u.protocol === "https:" ? null : m.http;
      } catch {
        return m.invalid;
      }
    },
    toDestination: (raw) => raw.trim(),
    fromDestination: (d) => d,
  },
  {
    value: "vcard",
    placeholder: "Alex Rivera",
    inputType: "text",
    validate: (raw, t) => (raw.trim() ? null : t.editor.contentTypes.vcard.required),
    toDestination: (raw) => `BEGIN:VCARD\nVERSION:3.0\nFN:${raw.trim()}\nEND:VCARD`,
    fromDestination: (d) => /FN:(.*)/.exec(d)?.[1] ?? "",
  },
  {
    value: "wifi",
    placeholder: "Qdot-Guest",
    inputType: "text",
    validate: (raw, t) => (raw.trim() ? null : t.editor.contentTypes.wifi.required),
    toDestination: (raw) => `WIFI:T:WPA;S:${raw.trim()};;`,
    fromDestination: (d) => /S:([^;]*)/.exec(d)?.[1] ?? "",
  },
  {
    value: "email",
    placeholder: "hello@example.com",
    inputType: "email",
    validate: (raw, t) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim()) ? null : t.editor.contentTypes.email.invalid),
    toDestination: (raw) => `mailto:${raw.trim()}`,
    fromDestination: (d) => d.replace(/^mailto:/, ""),
  },
  {
    value: "sms",
    placeholder: "+33 6 12 34 56 78",
    inputType: "tel",
    validate: (raw, t) => (PHONE.test(raw.trim()) ? null : t.editor.contentTypes.sms.invalid),
    toDestination: (raw) => `sms:${raw.replace(/[^\d+]/g, "")}`,
    fromDestination: (d) => d.replace(/^sms:/, ""),
  },
  {
    value: "phone",
    placeholder: "+33 6 12 34 56 78",
    inputType: "tel",
    validate: (raw, t) => (PHONE.test(raw.trim()) ? null : t.editor.contentTypes.phone.invalid),
    toDestination: (raw) => `tel:${raw.replace(/[^\d+]/g, "")}`,
    fromDestination: (d) => d.replace(/^tel:/, ""),
  },
];

export function contentTypeConfig(type: QRContentType): ContentTypeConfig {
  return CONTENT_TYPES.find((t) => t.value === type) ?? CONTENT_TYPES[0];
}
