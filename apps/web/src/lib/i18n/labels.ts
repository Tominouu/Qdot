import { INTL_LOCALE, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

/**
 * The API formats chart buckets and peak times in English ("Mon", "Sep 29",
 * "Monday 3PM"). These helpers re-express them in the UI language.
 */
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 2024-01-01 was a Monday.
const weekdayName = (i: number, locale: Locale, style: "long" | "short") =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: style, timeZone: "UTC" }).format(Date.UTC(2024, 0, 1 + i));
const monthName = (i: number, locale: Locale) =>
  new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short", timeZone: "UTC" }).format(Date.UTC(2024, i, 1));

function hour24(h12: number, meridiem: string) {
  return (h12 % 12) + (meridiem === "PM" ? 12 : 0);
}

export function localizeTimeLabel(label: string, locale: Locale): string {
  if (locale === "en") return label;
  // "Monday 3PM" / "3PM" (peak activity)
  const peak = /^(?:([A-Z][a-z]+) )?(\d{1,2})(AM|PM)$/.exec(label);
  if (peak) {
    const day = peak[1] ? WEEKDAYS.indexOf(peak[1]) : -1;
    const time = `${hour24(Number(peak[2]), peak[3])} h`;
    return day >= 0 ? `${weekdayName(day, locale, "long")} ${time}` : time;
  }
  // "Sep 29"
  const monthDay = /^([A-Z][a-z]{2}) (\d{1,2})$/.exec(label);
  if (monthDay && MONTHS.includes(monthDay[1])) return `${monthDay[2]} ${monthName(MONTHS.indexOf(monthDay[1]), locale)}`;
  // "Sep"
  if (MONTHS.includes(label)) return monthName(MONTHS.indexOf(label), locale);
  // "Mon"
  const day = WEEKDAYS.findIndex((d) => d.slice(0, 3) === label);
  if (day >= 0) return weekdayName(day, locale, "short");
  return label;
}

/** Country name in the UI language from its ISO code, falling back to the stored (English) name. */
export function countryName(code: string | null | undefined, fallback: string, locale: Locale): string {
  if (!code || !/^[A-Z]{2}$/.test(code) || code === "XX") return fallback;
  try {
    return new Intl.DisplayNames([INTL_LOCALE[locale]], { type: "region" }).of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Generic buckets the API names in English ("Other", "Unknown", device types). */
export function localizeShareLabel(label: string, t: Dictionary): string {
  switch (label) {
    case "Other":
      return t.common.other;
    case "Unknown":
      return t.common.unknown;
    case "Mobile":
      return t.analytics.deviceTypes.mobile;
    case "Tablet":
      return t.analytics.deviceTypes.tablet;
    case "Desktop":
      return t.analytics.deviceTypes.desktop;
    default:
      return label;
  }
}
