import type { PhoneContent } from "@/types";
import { defineQRType, normalizePhone, PHONE_PATTERN } from "./define";

export const phonePayload = (c: PhoneContent) => `tel:${normalizePhone(c.phone)}`;

export const phoneType = defineQRType({
  type: "phone",
  dynamic: false,
  defaults: () => ({ type: "phone", phone: "" }),
  payload: phonePayload,
  validate: (c, t) => (PHONE_PATTERN.test(c.phone.trim()) ? {} : { phone: t.editor.contentTypes.phone.invalid }),
  summary: (c) => c.phone,
});
