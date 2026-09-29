import type { SmsContent } from "@/types";
import { defineQRType, normalizePhone, PHONE_PATTERN } from "./define";

/** SMSTO:number:message, the form Android and iOS camera apps both open in Messages. */
export const smsPayload = (c: SmsContent) => `SMSTO:${normalizePhone(c.phone)}:${c.message.trim()}`;

export const smsType = defineQRType({
  type: "sms",
  dynamic: false,
  defaults: () => ({ type: "sms", phone: "", message: "" }),
  payload: smsPayload,
  validate: (c, t) => (PHONE_PATTERN.test(c.phone.trim()) ? {} : { phone: t.editor.contentTypes.sms.invalid }),
  summary: (c) => c.phone,
});
