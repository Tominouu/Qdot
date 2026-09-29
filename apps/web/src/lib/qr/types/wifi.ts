import type { WifiContent } from "@/types";
import { defineQRType } from "./define";

/** Characters with a meaning in the WIFI: syntax are backslash-escaped (ZXing / Wi-Fi Alliance format). */
export const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");

/** WPA3 is announced as SAE (Wi-Fi Alliance WPA3 spec); devices then negotiate. */
const AUTH: Record<WifiContent["security"], string> = { WPA: "WPA", WPA3: "SAE", WEP: "WEP", nopass: "nopass" };

export function wifiPayload(c: WifiContent): string {
  const parts = [`T:${AUTH[c.security]}`, `S:${escapeWifi(c.ssid)}`];
  if (c.security !== "nopass") parts.push(`P:${escapeWifi(c.password)}`);
  parts.push(`H:${c.hidden ? "true" : "false"}`);
  return `WIFI:${parts.join(";")};;`;
}

export const wifiType = defineQRType({
  type: "wifi",
  dynamic: false,
  defaults: () => ({ type: "wifi", ssid: "", security: "WPA", password: "", hidden: false }),
  payload: wifiPayload,
  validate: (c, t) => {
    const m = t.editor.contentTypes.wifi;
    const errors: Record<string, string> = {};
    if (!c.ssid) errors.ssid = m.required;
    else if (new TextEncoder().encode(c.ssid).length > 32) errors.ssid = m.ssidTooLong;
    if (c.security !== "nopass") {
      if (!c.password) errors.password = m.passwordRequired;
      else if (c.security !== "WEP" && (c.password.length < 8 || c.password.length > 63)) errors.password = m.passwordLength;
    }
    return errors;
  },
  summary: (c) => c.ssid,
});
