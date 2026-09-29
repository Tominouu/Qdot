import type { EmailContent } from "@/types";
import { defineQRType, EMAIL_PATTERN } from "./define";

/** mailto: with RFC 6068 percent-encoding (spaces as %20, line breaks as %0D%0A). */
export function emailPayload(c: EmailContent): string {
  const enc = (s: string) => encodeURIComponent(s).replace(/%0A/g, "%0D%0A").replace(/%0D%0D%0A/g, "%0D%0A");
  const params = [c.subject.trim() && `subject=${enc(c.subject.trim())}`, c.body.trim() && `body=${enc(c.body.trim())}`].filter(Boolean);
  return `mailto:${c.to.trim()}${params.length ? `?${params.join("&")}` : ""}`;
}

export const emailType = defineQRType({
  type: "email",
  dynamic: false,
  defaults: () => ({ type: "email", to: "", subject: "", body: "" }),
  payload: emailPayload,
  validate: (c, t) => (EMAIL_PATTERN.test(c.to.trim()) ? {} : { to: t.editor.contentTypes.email.invalid }),
  summary: (c) => c.to,
});
