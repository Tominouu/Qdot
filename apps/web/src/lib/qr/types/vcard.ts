import type { VCardContent } from "@/types";
import { defineQRType, EMAIL_PATTERN, isHttpUrl, normalizePhone, PHONE_PATTERN } from "./define";

/** RFC 6350 §3.4 text escaping. */
export const escapeVCard = (value: string) => value.trim().replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** vCard 3.0: the version every phone camera and QR reader imports. */
export function vcardPayload(c: VCardContent): string {
  const e = escapeVCard;
  const fullName = [c.firstName, c.lastName].map((s) => s.trim()).filter(Boolean).join(" ") || c.organization.trim();
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${e(c.lastName)};${e(c.firstName)};;;`, `FN:${e(fullName)}`];
  if (c.organization.trim()) lines.push(`ORG:${e(c.organization)}`);
  if (c.jobTitle.trim()) lines.push(`TITLE:${e(c.jobTitle)}`);
  if (c.phone.trim()) lines.push(`TEL;TYPE=CELL:${normalizePhone(c.phone)}`);
  if (c.email.trim()) lines.push(`EMAIL:${c.email.trim()}`);
  if (c.website.trim()) lines.push(`URL:${c.website.trim()}`);
  if ([c.street, c.city, c.postalCode, c.country].some((s) => s.trim()))
    lines.push(`ADR;TYPE=WORK:;;${e(c.street)};${e(c.city)};;${e(c.postalCode)};${e(c.country)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export const vcardType = defineQRType({
  type: "vcard",
  dynamic: false,
  defaults: () => ({
    type: "vcard",
    firstName: "",
    lastName: "",
    organization: "",
    jobTitle: "",
    phone: "",
    email: "",
    website: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
  }),
  payload: vcardPayload,
  validate: (c, t) => {
    const m = t.editor.contentTypes.vcard;
    const errors: Record<string, string> = {};
    if (!c.firstName.trim() && !c.lastName.trim() && !c.organization.trim()) errors.firstName = m.required;
    if (c.phone.trim() && !PHONE_PATTERN.test(c.phone.trim())) errors.phone = t.editor.contentTypes.phone.invalid;
    if (c.email.trim() && !EMAIL_PATTERN.test(c.email.trim())) errors.email = t.editor.contentTypes.email.invalid;
    if (c.website.trim() && !isHttpUrl(c.website)) errors.website = t.editor.contentTypes.url.invalid;
    return errors;
  },
  summary: (c) => [c.firstName, c.lastName].filter((s) => s.trim()).join(" ") || c.organization,
});
