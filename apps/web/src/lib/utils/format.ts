import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";

export function formatNumber(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(value);
}

export function formatDelta(value: number, locale: Locale = "en"): string {
  const n = new Intl.NumberFormat(INTL_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  return `${value >= 0 ? "+" : ""}${n}${locale === "fr" ? " %" : "%"}`;
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function formatRelativeTime(iso: string, locale: Locale = "en", now = Date.now()): string {
  const diffMin = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale], { numeric: "auto" });
  if (diffMin < 1) return rtf.format(0, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/** Display a URL without protocol, as in the mobile designs ("qlynk.co/new-campaign"). */
export function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
