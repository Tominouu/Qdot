import { seededRandom } from "@/lib/utils/seeded-random";
import type { GeoShare, ScanEvent, ShareItem, TimeRange, TimeSeriesPoint } from "@/types";

/** Weekly shape taken from the Figma "Scans over time" chart (Mon → Sun). */
const WEEK_SHAPE = [0.62, 0.72, 0.64, 0.86, 0.83, 1, 0.94];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Deterministic scan series for a given range. `scale` is the peak bucket volume.
 * Real data will come from the analytics API already bucketed.
 */
export function buildTimeseries(range: TimeRange, scale: number, seed = 1): TimeSeriesPoint[] {
  const rand = seededRandom(seed);
  const jitter = (v: number) => Math.round(v * (0.92 + rand() * 0.16));
  const uniqueRatio = 0.66;

  const make = (label: string, weight: number): TimeSeriesPoint => {
    const total = jitter(scale * weight);
    return { label, total, unique: Math.round(total * (uniqueRatio + rand() * 0.06)) };
  };

  switch (range) {
    case "24h":
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i * 2;
        const diurnal = 0.25 + 0.75 * Math.sin((Math.PI * Math.max(0, hour - 6)) / 18) ** 2;
        return make(`${String(hour).padStart(2, "0")}:00`, diurnal / 8);
      });
    case "7d":
      return WEEKDAYS.map((d, i) => make(d, WEEK_SHAPE[i]));
    case "30d":
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date(Date.UTC(2026, 7, 30 + i));
        const trend = 0.7 + (i / 29) * 0.3;
        return make(`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`, trend * WEEK_SHAPE[i % 7]);
      });
    case "3m":
      return Array.from({ length: 13 }, (_, i) => {
        const date = new Date(Date.UTC(2026, 6, 1 + i * 7));
        return make(`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`, (0.55 + (i / 12) * 0.45) * 7);
      });
    case "all":
      return MONTHS.slice(0, 9).map((m, i) => make(m, (0.2 + (i / 8) * 0.8) * 30));
  }
}

export const RANGE_MULTIPLIER: Record<TimeRange, number> = {
  "24h": 0.035,
  "7d": 0.24,
  "30d": 1,
  "3m": 2.7,
  all: 6.2,
};

export function buildSparkline(seed: number, length = 8): number[] {
  const rand = seededRandom(seed);
  let v = 0.4;
  return Array.from({ length }, (_, i) => {
    v = Math.min(1, Math.max(0.05, v + (rand() - 0.35) * 0.35 + i * 0.01));
    return v;
  });
}

export const GEOGRAPHY: GeoShare[] = [
  { label: "France", countryCode: "FR", share: 72, lat: 46.6, lng: 2.4 },
  { label: "Belgium", countryCode: "BE", share: 11, lat: 50.6, lng: 4.6 },
  { label: "Switzerland", countryCode: "CH", share: 8, lat: 46.8, lng: 8.2 },
  { label: "Germany", countryCode: "DE", share: 5, lat: 51.1, lng: 10.4 },
  { label: "Other", countryCode: "XX", share: 4, lat: 40.7, lng: -74 },
];

export const DEVICES: ShareItem[] = [
  { label: "Mobile", share: 94 },
  { label: "Desktop", share: 4 },
  { label: "Tablet", share: 2 },
];

export const BROWSERS: ShareItem[] = [
  { label: "Safari", share: 52 },
  { label: "Chrome", share: 31 },
  { label: "Firefox", share: 10 },
  { label: "Edge", share: 7 },
];

export const OPERATING_SYSTEMS: ShareItem[] = [
  { label: "iOS", share: 61 },
  { label: "Android", share: 33 },
  { label: "macOS", share: 4 },
  { label: "Windows", share: 2 },
];

export const REFERRERS: ShareItem[] = [
  { label: "Direct scan", share: 88 },
  { label: "instagram.com", share: 7 },
  { label: "Other", share: 5 },
];

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

/** Recent scans shown in the "Recent scan history" table. */
export function buildRecentScans(qrCodeId: string): ScanEvent[] {
  return [
    { minutes: 2, country: "France", countryCode: "FR", city: "Paris", device: "mobile", deviceModel: "iPhone 15", os: "iOS 18", browser: "Safari" },
    { minutes: 12, country: "USA", countryCode: "US", city: "New York", device: "mobile", deviceModel: "Pixel 8", os: "Android 14", browser: "Chrome" },
    { minutes: 45, country: "UK", countryCode: "GB", city: "London", device: "mobile", deviceModel: "iPhone 14 Pro", os: "iOS 17", browser: "Safari" },
    { minutes: 60, country: "Germany", countryCode: "DE", city: "Berlin", device: "mobile", deviceModel: "Samsung S24", os: "Android 14", browser: "Samsung Internet" },
    { minutes: 120, country: "Japan", countryCode: "JP", city: "Tokyo", device: "tablet", deviceModel: "iPad Air", os: "iPadOS 18", browser: "Chrome" },
  ].map((row, i) => ({
    id: `${qrCodeId}_scan_${i}`,
    qrCodeId,
    scannedAt: minutesAgo(row.minutes),
    country: row.country,
    countryCode: row.countryCode,
    city: row.city,
    device: row.device as ScanEvent["device"],
    deviceModel: row.deviceModel,
    os: row.os,
    browser: row.browser,
    referrer: null,
  }));
}
