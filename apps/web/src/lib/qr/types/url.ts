import { defineQRType, isHttpUrl } from "./define";

export const urlType = defineQRType({
  type: "url",
  dynamic: true,
  defaults: () => ({ type: "url", url: "" }),
  payload: (c) => c.url.trim(),
  validate: (c, t) => {
    const m = t.editor.contentTypes.url;
    if (!c.url.trim()) return { url: m.required };
    return isHttpUrl(c.url) ? {} : { url: /^[a-z]+:/i.test(c.url.trim()) && !/^https?:/i.test(c.url.trim()) ? m.http : m.invalid };
  },
  summary: (c) => c.url.replace(/^https?:\/\//, ""),
});
