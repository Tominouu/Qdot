import { UAParser } from "ua-parser-js";

export interface ParsedAgent {
  deviceType: "mobile" | "tablet" | "desktop";
  os: string | null;
  browser: string | null;
  isBot: boolean;
}

// Link-preview fetchers, crawlers and scripts shouldn't count as scans.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp\/|vkshare|pinterest|curl|wget|python-requests|httpclient|go-http-client|headless|lighthouse|monitor/i;

const OS_NAMES: Record<string, string> = {
  "Mac OS": "macOS",
  "Chromium OS": "ChromeOS",
  Ubuntu: "Linux",
  Debian: "Linux",
  Fedora: "Linux",
};

const BROWSER_NAMES: Record<string, string> = {
  "Mobile Safari": "Safari",
  "Chrome WebView": "Chrome",
  "Chrome Headless": "Chrome",
  "Mobile Chrome": "Chrome",
  "Mobile Firefox": "Firefox",
  "Samsung Browser": "Samsung Internet",
  "Edge": "Edge",
  "Opera Mobi": "Opera",
  "Opera Touch": "Opera",
  GSA: "Google App",
};

/** Normalized device / OS / browser. The raw User-Agent is not stored. */
export function parseUserAgent(ua: string | undefined): ParsedAgent {
  const value = ua ?? "";
  const r = new UAParser(value).getResult();
  const t = r.device.type;
  const deviceType = t === "mobile" || t === "wearable" ? "mobile" : t === "tablet" ? "tablet" : "desktop";
  const os = r.os.name ? (OS_NAMES[r.os.name] ?? r.os.name) : null;
  const browser = r.browser.name ? (BROWSER_NAMES[r.browser.name] ?? r.browser.name) : null;
  return { deviceType, os, browser, isBot: !value || BOT_PATTERN.test(value) };
}
